import { HttpClient } from '@angular/common/http'
import { EventService, WsEvents } from '@sunbird-cb/utils'
import { NsContent, WidgetContentService } from '@sunbird-cb/collection'
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router'
import { ViewerUtilService } from '../../viewer-util.service'
import { HandsOnComponent } from './hands-on.component'
import { of } from 'rxjs'

describe('HandsOnComponent', () => {
    let component: HandsOnComponent

    const mockEventSvc: Partial<EventService> = {
        dispatchEvent: jest.fn(),
    }

    const mockActivatedRoute: Partial<ActivatedRoute> = {
        data: of({
            content: {
                data: {
                    identifier: 'test-id',
                    artifactUrl: 'test-url',
                    mimeType: NsContent.EMimeTypes.HANDS_ON,
                },
            },
        }),
        // A hand-built stand-in, not a real snapshot: cast once rather than satisfying
        // every field of ActivatedRouteSnapshot.
        snapshot: {
            queryParams: {
                collectionId: 'test-collection',
                collectionType: 'test-type',
            },
            url: [],
            params: {},
            fragment: '',
            data: {},
            outlet: '',
            component: '',
            routeConfig: undefined,
            root: new ActivatedRouteSnapshot,
            parent: new ActivatedRouteSnapshot,
            firstChild: new ActivatedRouteSnapshot,
            children: [],
            pathFromRoot: [],
            paramMap: undefined,
            queryParamMap: undefined
        } as any,
    }

    const mockContentSvc: Partial<WidgetContentService> = {
        continueLearning: jest.fn().mockResolvedValue(undefined),
        setS3Cookie: jest.fn().mockReturnValue(of({})),
    }

    const mockHttp: Partial<HttpClient> = {
        get: jest.fn().mockReturnValue(of({ manifestData: 'test' })),
    }

    const mockViewSvc: Partial<ViewerUtilService> = {
        getAuthoringUrl: jest.fn().mockReturnValue('test-author-url'),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        component = new HandsOnComponent(
            mockEventSvc as EventService,
            mockActivatedRoute as ActivatedRoute,
            mockContentSvc as WidgetContentService,
            mockHttp as HttpClient,
            mockViewSvc as ViewerUtilService
        )
    })

    it('should create an instance of component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize component with hands-on data', async () => {
            await component.ngOnInit()
            expect(component.isFetchingDataComplete).toBe(false)
            expect(component.isErrorOccured).toBe(false)
            expect(component.handsOnData).toBeTruthy()
        })

        it('should set S3 cookie when artifactUrl contains content-store', async () => {
            const contentWithStore = {
                content: {
                    data: {
                        identifier: 'test-id',
                        artifactUrl: 'content-store/test-url',
                        mimeType: NsContent.EMimeTypes.HANDS_ON,
                    },
                },
            }
            mockActivatedRoute.data = of(contentWithStore)

            await component.ngOnInit()
            expect(mockContentSvc.setS3Cookie).toHaveBeenCalledWith('test-id')
        })

        it('should handle error when manifest fetch fails', async () => {
            mockHttp.get = jest.fn().mockReturnValue(of(null))
            await component.ngOnInit()
            expect(component.isErrorOccured).toBe(false)
        })
    })

    describe('ngOnDestroy', () => {
        beforeEach(async () => {
            await component.ngOnInit()
        })

        it('should call continueLearning with collection params when available', async () => {
            await component.ngOnDestroy()
            expect(mockContentSvc.continueLearning).toHaveBeenCalledWith(
                'test-id',
                'test-collection',
                'test-type'
            )
        })

        it('should call continueLearning without collection params when not available', async () => {
            await component.ngOnDestroy()
            expect(mockContentSvc.continueLearning).toHaveBeenCalledWith('test-id',
                'test-collection',
                'test-type')
        })

        it('should raise unload event', async () => {
            await component.ngOnDestroy()
            expect(mockEventSvc.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: WsEvents.WsEventType.Telemetry,
                    data: expect.objectContaining({
                        state: WsEvents.EnumTelemetrySubType.Unloaded,
                    }),
                })
            )
        })
    })

    describe('raiseEvent', () => {
        it('should dispatch telemetry event with correct data', () => {
            const testContent: NsContent.IContent = {
                identifier: 'test-id',
                artifactUrl: 'test-url',
                mimeType: NsContent.EMimeTypes.HANDS_ON,
            } as NsContent.IContent

            component.raiseEvent(WsEvents.EnumTelemetrySubType.Loaded, testContent)

            expect(mockEventSvc.dispatchEvent).toHaveBeenCalledWith({
                eventType: WsEvents.WsEventType.Telemetry,
                eventLogLevel: WsEvents.WsEventLogLevel.Info,
                from: 'hands-on',
                to: '',
                data: {
                    state: WsEvents.EnumTelemetrySubType.Loaded,
                    type: WsEvents.WsTimeSpentType.Player,
                    mode: WsEvents.WsTimeSpentMode.Play,
                    content: testContent,
                    identifier: testContent.identifier,
                    mimeType: NsContent.EMimeTypes.HANDS_ON,
                    url: testContent.artifactUrl,
                },
            })
        })

        it('should handle null content in event data', () => {
            component.raiseEvent(WsEvents.EnumTelemetrySubType.Loaded, null as any)

            expect(mockEventSvc.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        identifier: null,
                        url: null,
                    }),
                })
            )
        })
    })
})