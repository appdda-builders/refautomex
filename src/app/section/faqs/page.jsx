'use client';
import React, { useState } from 'react';
import MetaHead from '@/app/components/meta-head';
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';

export default function FAQs () {
  const [activeSection, setActiveSection] = useState('faqs');
  const { t } = useTranslation();

  const Section = ({ title, contents }) => (
    <div className="border-b-4 border-gray-50 pt-4">
      <h2 className="text-xl text-center font-bold text-stone-600 dark:text-stone-50">{title}</h2>
      {contents.map((content, index) => (
        <div key={index} className="my-4 md:my-6 bg-stone-100 dark:bg-stone-950 py-2 shadow rounded-xl px-10 cursor-pointer animate-out">
          <p className="font-medium text-gray-900 dark:text-gray-200">{content.question}</p>
          <p className="text-gray-600 dark:text-gray-400">{content.answer}</p>
        </div>
      ))}
    </div>
  );
  
  const OffsetSection = ({ children }) => (
    <div className="bg-stone-300 dark:bg-stone-800 rounded-3xl px-10 py-5 shadow-md min-h-[350px]">
      {children}
    </div>
  );

  const sections = {
    faqs: [
      {
        question: t('faqs.QuestionOne'),
        answer: t('faqs.AnswerOne')
      },
      {
        question: t('faqs.QuestionTwo'),
        answer: t('faqs.AnswerTwo')
      },
      {
        question: t('faqs.QuestionThree'),
        answer: t('faqs.AnswerThree')
      },
      {
        question: t('faqs.QuestionFour'),
        answer: t('faqs.AnswerFour')
      },
    ],

    service: [
      {
        question: t('faqs.QuestionFive'),
        answer: t('faqs.AnswerFive')
      },
      {
        question: t('faqs.QuestionSix'),
        answer: t('faqs.AnswerSix')
      },
    ]

  };

  return (
    <section className='dark:bg-black'>
      <MetaHead title="FAQs"/>
      <div className="container mx-auto py-32 sm:py-40 p-4 ">
        <div className="flex flex-col lg:flex-row">
          <aside className="w-full lg:w-1/4 flex justify-center items-center">
            <ul className="space-y-6 w-full">
              {Object.keys(sections).map((section) => (
                <li key={section} className="animate-out text-yellow-500 hover:text-amber-500 font-bold text-center border-b-4 border-stone-300 bg-slate-50 dark:bg-stone-700 shadow cursor-pointer" onClick={() => setActiveSection(section)}>
                  {section === 'faqs' ? t('faqs.sectionOne') : t('faqs.sectionTwo')}
                </li>
              ))}
            </ul>
          </aside>

          <main className="mt-4 lg:mt-0 lg:ml-12 lg:w-3/4">
            <OffsetSection>
              <Section title={activeSection === 'faqs' ? t('faqs.sectionOne') : t('faqs.sectionTwo')} contents={sections[activeSection]} />
            </OffsetSection>
          </main>
        </div>
      </div>
    </section>
  );
};