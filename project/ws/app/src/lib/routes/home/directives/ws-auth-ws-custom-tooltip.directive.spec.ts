import { WsCustomTooltipDirective } from './ws-auth-ws-custom-tooltip.directive';

describe('WsCustomTooltipDirective', () => {
  it('should create an instance', () => {
    const directive = new WsCustomTooltipDirective(
      {} as any,   // Overlay
      {} as any,   // OverlayPositionBuilder
      {} as any,   // ElementRef
      { run: (fn: any) => fn() } as any,   // NgZone
    );
    expect(directive).toBeTruthy();
  });
});
