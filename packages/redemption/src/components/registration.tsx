import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeList from './code-list';
import Banner from './banner';
import { CodeProps } from './types';
import TermsAndConditions from './terms-and-conditions';
import Prompt from './prompt';
import { Formik } from 'formik';

const Registration = ({ valid, validate }: CodeProps): JSX.Element => {
  const styles = {
    inputStyle:
      'p-4 text-sm w-full ring-1 ring-gray-300 ring-inset shadow-inner focus:outline-none focus:ring-gray-500 mb-4',
    nameInput:
      'p-4 text-sm w-full ring-1 ring-gray-300 ring-inset shadow-inner focus:outline-none focus:ring-gray-500 mb-4 mr-4',
    nameContainer: 'flex flex-row',
    redirect: 'mb-4',
    member: 'text-gray-600'
  };

  const { t } = useTranslation();

  return (
    <>
      <Prompt />
      <Banner valid={valid} />
      <p className={styles.redirect}>
        <strong className={styles.member}>{`${t('already-member')}\u00A0`}</strong>
        <button type="button">
          <strong>{t('sign-in')}</strong>
        </button>
      </p>
      <div className={styles.nameContainer}>
        <input className={styles.nameInput} placeholder={t('register-first-name')} />
        <input className={styles.inputStyle} placeholder={t('register-last-name')} />
      </div>
      <input className={styles.inputStyle} placeholder={t('register-email')} />
      <input className={styles.inputStyle} placeholder={t('register-password')} />
      <input className={styles.inputStyle} placeholder={t('register-confirm-password')} />
      <CodeList valid={valid} validate={validate} />
      <TermsAndConditions valid={valid} />
    </>
  );
};

Registration.displayName = 'Registration';
export default Registration;
