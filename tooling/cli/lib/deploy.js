const path = require('path');
const fs = require('fs-extra');
const fetch = require('isomorphic-unfetch');
const { gqlPluckFromCodeString } = require('@graphql-tools/graphql-tag-pluck');
const { print } = require('graphql/language/printer');
const { parse } = require('graphql/language');
const crypto = require('crypto');
const childProcess = require('child_process');
const tar = require('tar');
const os = require('os');

const { getFilePaths, filePathIsValid } = require('./helpers/filepaths');
const { instanceEndpoint } = require('./helpers/urls');

const OP_DIR = process.cwd();
const TMP_DIR = os.tmpdir();
const configPath = path.join(OP_DIR, '/ti-config');
const config = require(configPath);

const INSTANCE_NAME = process.env.INSTANCE_NAME;

const KEY_QUERY = `
  query CompanyDetailsQuery($nickname: String!) {
    HeliumLaunchData(nickname: $nickname) {
      key
      signedUrl
    }
  }
`;

const BATCH_QUERY = `
  query HeliumBatchQuery($key: String!, $nickname: String!) {
    HeliumBatch(key: $key, nickname: $nickname)
  }
`;

const JOB_QUERY = `
  query HeliumDeploymentStatusQuery($jobId: ID!) {
    HeliumDeploymentStatus(jobId: $jobId)
  }
`;

(async function () {
  const instance = findTIInstance();

  if (!instance) {
    throw new Error('Could not locate instance in configuration file.');
  }

  const policyData = await getHeliumUploadData(instance);
  const { key } = policyData;

  if (!policyData.key || !policyData.signedUrl) {
    throw new Error('Could not retrieve helium keys.');
  }

  try {
    await gatherUsedTranslations();
    await writeGraphqlManifest();
    await uploadHeliumProject(policyData);
    const batchJobId = await triggerBatch(instance, key);
    const fetchStatus = () => checkDeploymentJobStatus(instance, batchJobId);
    const processing = result => result !== 'SUCCEEDED' && result !== 'FAILED';
    await poll(fetchStatus, processing, 3000);
  } catch (e) {
    throw new Error(e);
  }
})()
  .then(() => {
    console.log('>>> Deploy successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('>>> Error deploying: ', err);
    process.exit(1);
  });

async function gatherUsedTranslations() {
  return new Promise((resolve, reject) => {
    const parserScript = path.join(__dirname, 'parse-translations.js');
    const exec = childProcess.exec;
    const parseProcess = exec(`node ${parserScript} && npm run build:vite`);

    parseProcess.stdout.pipe(process.stdout);
    parseProcess.stderr.pipe(process.stderr);

    parseProcess.on('error', err => reject(err)).on('exit', () => resolve());
  });
}

async function writeGraphqlManifest() {
  const queryHashMap = await hashGraphqlQueries();
  const distDir = path.join(OP_DIR, 'dist/client');
  await fs.writeFile(path.join(distDir, 'graphql-manifest.json'), JSON.stringify(queryHashMap));
  return;
}

async function hashGraphqlQueries() {
  const pagesFilePaths = await getFilePaths(path.join(OP_DIR, 'pages'));
  const componentsFilePaths = await getFilePaths(path.join(OP_DIR, 'components'));
  const filePaths = pagesFilePaths.concat(componentsFilePaths);
  const queryHashMap = {};

  for (const filePath of filePaths) {
    if (filePathIsValid(filePath)) {
      const querySources = await gqlPluckFromCodeString(
        filePath,
        fs.readFileSync(filePath, 'utf8')
      );

      if (querySources && querySources.length > 0) {
        for (const querySource of querySources) {
          const { hash, query } = hashQuery(querySource);
          queryHashMap[hash] = query;
        }
      }
    }
  }

  return queryHashMap;
}

function hashQuery(querySource) {
  const query = print(parse(querySource));
  const hash = crypto.createHash('sha256').update(query.trim()).digest('hex');

  return { hash, query };
}

async function uploadHeliumProject(policyData) {
  const filePath = path.join(TMP_DIR, INSTANCE_NAME + '.tgz');

  console.log('>>> Compressing project.');

  await tar.c(
    {
      gzip: true,
      file: filePath
    },
    ['.']
  );

  console.log('>>> Compressed!');

  await uploadToS3(filePath, policyData);

  return true;
}

async function triggerBatch(instance, key) {
  return new Promise((resolve, reject) => {
    const endpoint = instanceEndpoint(instance);
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: BATCH_QUERY,
        variables: { key, nickname: instance.nickname }
      })
    };

    fetch(endpoint, options)
      .then(r => r.json())
      .then(res => {
        const resObj = res[0];
        if (resObj.data) {
          resolve(resObj.data.HeliumBatch);
        } else {
          const err = resObj.errors[0];
          reject(err.message);
        }
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

async function getHeliumUploadData(instance) {
  const endpoint = instanceEndpoint(instance);

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: KEY_QUERY, variables: { nickname: instance.nickname } })
  };

  let responseData = {};
  const launchData = await fetch(endpoint, options).then(r => r.json());

  if (launchData && launchData[0] && launchData[0].data) {
    const {
      data: {
        HeliumLaunchData: { key, signedUrl }
      }
    } = launchData[0];

    responseData = {
      key,
      signedUrl
    };
  }

  return responseData;
}

const UPLOAD_TRIES = 3;
function uploadToS3(filePath, policyData, tryCount = 0) {
  return new Promise((resolve, reject) => {
    const { signedUrl } = policyData;

    const options = {
      method: 'PUT',
      body: fs.createReadStream(filePath),
      headers: { 'Content-Length': fs.statSync(filePath).size }
    };

    fetch(signedUrl, options)
      .then(res => {
        if (res.status && res.status === 200) {
          resolve();
        } else {
          reject(new Error('Could not upload to S3.'));
        }
        resolve();
      })
      .catch(err => {
        if (tryCount < UPLOAD_TRIES) {
          tryCount++;
          console.log('>>> Retrying upload...');
          uploadToS3(filePath, policyData, tryCount).then(resolve).catch(reject);
        } else {
          console.error('error while uploading: ', err.message);
          reject(err);
        }
      });
  });
}

function findTIInstance() {
  const { instances = [] } = config;
  let instance;

  if (INSTANCE_NAME) {
    const possibleMatch = instances.find(instance => instance.nickname === INSTANCE_NAME);
    if (possibleMatch && possibleMatch.apiKey) {
      instance = possibleMatch;
    }
  }

  return instance;
}

async function checkDeploymentJobStatus(instance, jobId) {
  return new Promise((resolve, reject) => {
    const endpoint = instanceEndpoint(instance);
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: JOB_QUERY,
        variables: { jobId }
      })
    };

    fetch(endpoint, options)
      .then(r => r.json())
      .then(res => {
        const resObj = res[0];

        if (resObj.data) {
          resolve(resObj.data.HeliumDeploymentStatus);
        } else {
          const err = resObj.errors[0];
          reject(err.message);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

async function poll(fn, processingFn, ms) {
  let result = await fn();
  let status = result.toLowerCase();

  console.log(`>>> Deployment status: ${status}`);

  while (processingFn(result)) {
    await wait(ms);
    result = await fn();
    const latestStatus = result.toLowerCase();

    if (latestStatus !== status) {
      status = latestStatus;
      console.log(`>>> Deployment status: ${status}`);
    }
  }

  return result;
}

function wait(ms = 1000) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
