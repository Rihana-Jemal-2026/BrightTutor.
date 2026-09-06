import { LivenessCheck, LivenessChallenge } from './liveness-check';

const reference = Array(128).fill(.01);
function setup(actions: LivenessChallenge['actions'] = ['right', 'left']) {
  const check = new LivenessCheck({ id: 'test', actions, issuedAt: '', expiresAt: '' }, reference);
  let at = 0;
  const frames = (eye: number, yaw: number, count = 3) => {
    for (let i = 0; i < count; i++) { at += 200; check.add({ at, eye, yaw, descriptor: [...reference] }); }
  };
  return { check, frames };
}
describe('interactive liveness sequence', () => {
  it('finishes face matching before presenting head-turn instructions', () => {
    const { check, frames } = setup(['left', 'right']);
    expect(check.identityMatched).toBe(false);
    expect(check.instruction).toContain('Checking your face');
    frames(.3, 0, 2);
    expect(check.identityMatched).toBe(false);
    expect(check.instruction).not.toContain('Slowly turn');
    frames(.3, 0, 1);
    expect(check.identityMatched).toBe(true);
    expect(check.instruction).toContain('Slowly turn your head to your left');
    expect(check.complete).toBe(false);
  });
  it('does not require eye opening or blink detection to complete head turns', () => {
    const { check, frames } = setup(['left', 'right']);
    frames(.1, 0); frames(.1, -.25, 2); frames(.1, 0, 2);
    frames(.1, .25, 2); frames(.1, 0, 2);
    expect(check.complete).toBe(true);
    expect(check.instruction).toContain('complete');
  });
  for (const actions of [['right', 'left'], ['left', 'right']] as const) {
    it(`accepts the ordered ${actions.join(', ')} challenge after returning to center`, () => {
      const { check, frames } = setup([...actions]);
      frames(.3, 0);
      for (const action of actions) {
        frames(.3, action === 'left' ? -.25 : action === 'right' ? .25 : 0, 2);
        expect(check.complete).toBe(false);
        frames(.3, 0, 2);
      }
      expect(check.complete).toBe(true);
    });
  }
  it('does not accept a motionless photo', () => {
    const { check, frames } = setup(); frames(.3, 0, 30); expect(check.complete).toBe(false);
  });
  it('does not accept the wrong action order', () => {
    const { check, frames } = setup();
    frames(.3, 0); frames(.3, -.25); frames(.3, 0); frames(.1, 0); frames(.3, 0);
    expect(check.complete).toBe(false);
  });
  it('rejects a changed face', () => {
    const { check, frames } = setup(); frames(.3, 0);
    expect(() => check.add({ at: 800, eye: .3, yaw: 0, descriptor: Array(128).fill(.4) })).toThrow();
  });
  it('rejects a gap in tracking', () => {
    const { check, frames } = setup(); frames(.3, 0);
    expect(() => check.add({ at: 4000, eye: .3, yaw: 0, descriptor: reference })).toThrow();
  });
  it('rejects malformed face measurements', () => {
    const { check } = setup();
    expect(() => check.add({ at: 200, eye: NaN, yaw: 0, descriptor: reference })).toThrow();
  });
});
