const fetch = require('isomorphic-unfetch');
const url = require('url');

const isAbsoluteUrl = url => {
  return new Promise((resolve, reject) => {
    if (typeof url !== 'string') {
      reject('Must provide an absolute URL.');
    }

    url = url.trim();
    if (url.includes(' ')) {
      return false;
    }

    try {
      new URL(url.startsWith('//') ? `https:${url}` : url);
      resolve(true);
    } catch (e) {
      reject('Must provide an absolute URL.');
    }
  });
};

const hasInput = value => {
  return new Promise((resolve, reject) => {
    value && value.trim().length ? resolve(true) : reject('Input is required.');
  });
};

const containsOnlyLetters = value => {
  return new Promise((resolve, reject) => {
    /^[a-z]+$/i.test(value) ? resolve(true) : reject('Nickname can only contain letters.');
  });
};

const isEmail = value => {
  return new Promise((resolve, reject) => {
    value && /.+\@.+\..+/.test(value)
      ? resolve(true)
      : reject('Value must be a valid email address.');
  });
};

const isInstance = instance => {
  const pingUrl = url.resolve(instance.instanceUrl, '/incoming/v2/ping');
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${instance.apiKey}`
    }
  };

  return fetch(pingUrl, options)
    .then(res => res.json())
    .then(({ valid }) => {
      return !!valid;
    })
    .catch(e => {
      console.error(`Error validating instance: ${e.message}`);
      return false;
    });
};

module.exports = { hasInput, isAbsoluteUrl, containsOnlyLetters, isEmail, isInstance };
