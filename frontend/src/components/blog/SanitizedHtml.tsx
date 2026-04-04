import React from 'react';

type Props = {
  html: string;
};

export default function SanitizedHtml({ html }: Props) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
