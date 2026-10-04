import { OdcsMappingComponent } from './odcs-mapping.component'
import { of, throwError } from 'rxjs'
import * as _ from 'lodash'

// Mock classes for dependencies
const mockActivatedRoute = {
    data: of({
        pageData: {
            data: {
                frameworkConfig: [],
                defaultOdcsConfig: [{ frameworkId: null }],
                defaultKCMConfig: [{ frameworkId: null }],
                frameworkCreationMSg: 'Creating framework...',
                internalErrorMsg: 'Internal error occurred'
            }
        }
    }),
    snapshot: {
        data: {
            configService: {
                userProfile: {
                    rootOrgId: 'test-org-id',
                    departmentName: 'Test Department'
                },
                orgReadData: null as any,
                updateOrgReadData: jest.fn()
            }
        }
    }
}

const mockDesignationsService = {
    createFrameWork: jest.fn(),
    getOrgReadData: jest.fn()
}

const mockSnackBar = {
    open: jest.fn()
}

const mockDialog = {
    open: jest.fn()
}

const mockRouter = {
    navigate: jest.fn()
}

// Mock environment
jest.mock('../../../../../../../../../src/environments/environment', () => ({
    environment: {
        KCMframeworkName: 'test-kcm-framework',
        ODCSMasterFramework: 'odcs-master-framework',
        karmYogiPath: 'http://test-path/'
    }
}))

describe('OdcsMappingComponent', () => {
    let component: OdcsMappingComponent
    let mockEvent: Event

    beforeEach(() => {
        // Reset mocks before each test. mockActivatedRoute is module-level and shared, so
        // orgReadData has to be put back by hand - clearAllMocks only resets jest.fn()s.
        jest.clearAllMocks()
        mockActivatedRoute.snapshot.data.configService.orgReadData = null as any

        // Create component with mocked dependencies
        component = new OdcsMappingComponent(
            mockActivatedRoute as any,
            mockDesignationsService as any,
            mockSnackBar as any,
            mockDialog as any,
            mockRouter as any
        )

        // Mock window.dispatchEvent
        global.dispatchEvent = jest.fn()
        mockEvent = new Event('resize')
        window.Event = jest.fn(() => mockEvent) as any

        // Set initial values for environment
        component.environmentVal = { frameworkName: null, frameworkType: null, kcmFrameworkName: null }
    })

    describe('ngOnInit', () => {
        it('should initialize with existing framework ID', () => {
            // Setup. Without this the org has no framework yet and ngOnInit takes the
            // "create one" branch instead of the branch under test.
            mockActivatedRoute.snapshot.data.configService.orgReadData = {
                frameworkid: 'existing-framework-id'
            }

            // Act
            component.ngOnInit()

            // Assert
            expect(component.environmentVal.frameworkName).toBe('existing-framework-id')
            expect(component.environmentVal.frameworkType).toBe('MDO_DESIGNATION')
            expect(component.taxonomyConfig).toBeDefined()
            expect(component.showLoader).toBeFalsy()
        })

        it('should call createFreamwork when no framework ID exists', () => {
            // Setup
            mockActivatedRoute.snapshot.data.configService.orgReadData = null
            const spy = jest.spyOn(component, 'createFreamwork').mockImplementation()

            // Act
            component.ngOnInit()

            // Assert
            expect(component.showLoader).toBeTruthy()
            expect(component.loaderMsg).toBe('Creating framework...')
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('callResizeEvent', () => {
        it('should dispatch resize event after timeout', () => {
            // Setup
            jest.useFakeTimers()

            // Act
            component.callResizeEvent({})
            jest.runAllTimers()

            // Assert
            expect(window.dispatchEvent).toHaveBeenCalledWith(mockEvent)

            // Cleanup
            jest.useRealTimers()
        })
    })

    describe('createFreamwork', () => {
        beforeEach(() => {
            component.configSvc = {
                userProfile: {
                    departmentName: 'Test Department'
                }
            }
            component.orgId = 'test-org-id'
            component.environmentVal = {
                ODCSMasterFramework: 'odcs-master-framework'
            }
            component.odcConfig = {
                internalErrorMsg: 'Internal error occurred',
                frameworkCreationMSg: 'Creating framework...'
            }
        })

        it('should call getOrgReadData after successful framework creation', () => {
            // getOrgReadData runs behind a 5s setTimeout, so the clock has to be faked for
            // runAllTimers below to reach it.
            jest.useFakeTimers()

            // Setup
            const successResponse = { result: { framework: 'created-framework' } }
            mockDesignationsService.createFrameWork.mockReturnValue(of(successResponse))
            const getOrgReadDataSpy = jest.spyOn(component, 'getOrgReadData').mockImplementation()

            // Act
            component.createFreamwork()
            jest.runAllTimers()

            // Assert
            expect(mockDesignationsService.createFrameWork).toHaveBeenCalledWith(
                'odcs-master-framework',
                'test-org-id',
                'Test Department'
            )
            expect(getOrgReadDataSpy).toHaveBeenCalled()

            jest.useRealTimers()
        })

        it('should show error message when framework creation fails', () => {
            // Setup
            mockDesignationsService.createFrameWork.mockReturnValue(throwError(() => new Error('API Error')))

            // Act
            component.createFreamwork()

            // Assert
            expect(mockDesignationsService.createFrameWork).toHaveBeenCalled()
            expect(component.showLoader).toBeFalsy()
            expect(mockSnackBar.open).toHaveBeenCalledWith('Internal error occurred', 'X', { duration: 5000 })
        })
    })

    describe('getOrgReadData', () => {
        beforeEach(() => {
            component.orgId = 'test-org-id'
            component.environmentVal = {}
            component.odcConfig = {
                defaultOdcsConfig: [{ frameworkId: null }],
                defaultKCMConfig: [{ frameworkId: null }],
                frameworkConfig: []
            }
        })

        it('should update framework configuration on successful response', () => {
            // Setup
            const orgReadResponse = { frameworkid: 'new-framework-id' }
            mockDesignationsService.getOrgReadData.mockReturnValue(of(orgReadResponse))

            // Act
            component.getOrgReadData()

            // Assert
            expect(mockDesignationsService.getOrgReadData).toHaveBeenCalledWith('test-org-id')
            expect(component.environmentVal.frameworkName).toBe('new-framework-id')
            expect(component.environmentVal.frameworkType).toBe('MDO_DESIGNATION')
            expect(component.odcConfig.defaultOdcsConfig[0].frameworkId).toBe('new-framework-id')
            expect(component.showLoader).toBeFalsy()
        })
    })

    describe('openVideoPopup', () => {
        it('should open video dialog with correct URL', () => {
            // Setup
            component.environmentVal = { karmYogiPath: 'http://test-path/' }
            component.odcConfig = {
                topsection: {
                    guideVideo: {
                        url: '/video/guide.mp4'
                    }
                }
            }

            // Act
            component.openVideoPopup()

            // Assert
            expect(mockDialog.open).toHaveBeenCalledWith(
                expect.any(Function),
                expect.objectContaining({
                    data: {
                        videoLink: 'http://test-path//video/guide.mp4'
                    },
                    disableClose: true,
                    width: '50%',
                    height: '60%',
                    panelClass: 'overflow-visable'
                })
            )
        })
    })

    describe('routeToBulkUpload', () => {
        it('should navigate to bulk upload page', () => {
            // Act
            component.routeToBulkUpload()

            // Assert
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/odcs-upload'])
        })
    })
})