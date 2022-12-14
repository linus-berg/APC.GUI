/**
 *
 * ValidateAllButton
 *
 */
import { Button } from '@blueprintjs/core';
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {}

export const ProcessorBrowserButton = memo((props: Props) => {
  const nav = useNavigate();
  return (
    <Button intent="primary" icon="search" onClick={() => nav('/processor/')}>
      Browser
    </Button>
  );
});
