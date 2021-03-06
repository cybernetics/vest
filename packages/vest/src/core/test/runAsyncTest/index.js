import { OPERATION_MODE_STATELESS } from '../../../constants';
import context from '../../context';
import state from '../../state';
import { KEY_CANCELED } from '../../state/constants';
import cleanupCompleted from '../../suite/cleanupCompleted';
import hasRemainingTests from '../../suite/hasRemainingTests';
import * as suiteState from '../../suite/suiteState';
import { removeCanceled } from '../lib/canceled';
import { removePending } from '../lib/pending';

/**
 * Runs async test.
 * @param {VestTest} testObject A VestTest instance.
 */
const runAsyncTest = testObject => {
  const { asyncTest, statement, id, suiteId } = testObject;
  const { operationMode } = context.use();
  const done = cb => {
    const isCanceled = state.get()[KEY_CANCELED]?.[id];

    if (isCanceled) {
      removeCanceled(testObject);
    }

    // This is for cases in which the suite state was already reset
    if (!suiteState.getSuite(suiteId)) {
      return;
    }

    removePending(testObject);

    // We're returning here and not in the first `isCanceled` check
    // because we need to remove pending regardless - as long as the\
    // suite is present.
    if (isCanceled) {
      return;
    }

    // ❗️This callback is the `fail` function (see below)
    // it must run before running the done callbacks
    // so the field is marked as failed
    // before being passed to the `done` callback
    if (typeof cb === 'function') {
      cb();
    }

    // Perform required done callback calls and cleanups after the test is finished
    onAsyncTestFinished(testObject, operationMode);
  };
  const fail = rejectionMessage => {
    done(() => {
      testObject.statement =
        typeof rejectionMessage === 'string' ? rejectionMessage : statement;
      testObject.fail();
    });
  };
  context.run({ currentTest: testObject }, () => {
    try {
      asyncTest.then(done, fail);
    } catch (e) {
      fail();
    }
  });
};

/**
 * Runs done callback when async tests are finished running.
 * @param {String} suiteId
 * @param {string} [fieldName] Field name with associated callbacks.
 */
const runDoneCallbacks = (suiteId, fieldName) => {
  const currentState = suiteState.getCurrentState(suiteId);
  if (fieldName) {
    if (
      !hasRemainingTests(currentState, fieldName) &&
      Array.isArray(currentState.fieldCallbacks[fieldName])
    ) {
      currentState.fieldCallbacks[fieldName].forEach(cb => cb());
    }
  }
  if (!hasRemainingTests(currentState)) {
    currentState.doneCallbacks.forEach(cb => cb());
  }
};

/**
 * Perform completion actions and cleanups after an async test
 * @param {VestTest} testObject   A VestTest instance
 * @param {string} operationMode  Operation mode retrieved from context
 */
const onAsyncTestFinished = (testObject, operationMode) => {
  const { suiteId, fieldName } = testObject;

  runDoneCallbacks(suiteId, fieldName);

  if (operationMode === OPERATION_MODE_STATELESS) {
    cleanupCompleted(suiteId);
  }
};

export default runAsyncTest;
