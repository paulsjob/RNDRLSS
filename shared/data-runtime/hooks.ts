
import { useState, useEffect } from 'react';
import { liveBus, LiveValueRecord } from './index';
import { KeyId } from '../../contract/types';

export const useLiveValue = (keyId: KeyId | null): LiveValueRecord | null => {
  const [record, setRecord] = useState<LiveValueRecord | null>(() => 
    keyId ? liveBus.getValue(keyId) : null
  );

  useEffect(() => {
    if (!keyId) {
      setRecord(null);
      return;
    }

    return liveBus.subscribe(keyId, (newRecord) => {
      setRecord(newRecord);
    });
  }, [keyId]);

  return record;
};
