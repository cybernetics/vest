import runRegisterSuite from '../../../../testUtils/runRegisterSuite';
import getSuite from '../getSuite';
import getState from '.';

const suiteName = 'suite_1';
const suiteId = 'suiteId_1';
const suiteId_2 = 'suiteId_3';

describe('getState', () => {
  it('Should return current suite state by key', () => {
    runRegisterSuite({ name: suiteName, suiteId });
    runRegisterSuite({ name: suiteName, suiteId: suiteId_2 });
    const [currentState] = getSuite(suiteId);
    expect(getState(suiteId)).toBe(currentState);
  });
});
