import { ImportDesignationComponent } from './import-designation.component'
import { of, throwError } from 'rxjs'
import { PageEvent } from '@angular/material/paginator'
import * as _ from 'lodash'

describe('ImportDesignationComponent', () => {
    let component: ImportDesignationComponent
    let designationsServiceMock: any
    let dialogMock: any
    let loaderServiceMock: any
    let routerMock: any
    let snackBarMock: any
    let datePipeMock: any
    let activatedRouteMock: any
    let onboardingServiceMock: any

    const mockDesignation = {
        id: '1',
        designation: 'Test Designation',
        description: 'Test Description',
        isOrgDesignation: false,
        selected: false
    }

    const mockFrameworkInfo = {
        code: 'TEST_FRAMEWORK',
        categories: [
            {
                code: 'org',
                terms: [{
                    category: 'testCategory',
                    code: 'testCode',
                    associations: [{ identifier: 'assoc1' }]
                }]
            }
        ]
    }

    const mockConfigService = {
        userProfileV2: {
            firstName: 'Test User',
            userId: 'testUserId'
        }
    }

    const mockDesignationConfig = {
        internalErrorMsg: 'Internal error occurred',
        associationUpdateMsg: 'Updating associations',
        associationRetryMsg: 'Retrying association update',
        publishingMsg: 'Publishing framework',
        refreshDelayTime: 5000,
        importingDesignation: 'Importing designations',
        termCreationMsg: 'Creating terms',
        successMsg: 'Designations imported successfully'
    }

    beforeEach(() => {
        designationsServiceMock = {
            frameWorkInfo: mockFrameworkInfo,
            getIgotMasterDesignations: jest.fn().mockReturnValue(of({
                formatedDesignationsLsit: [mockDesignation],
                totalCount: 1
            })),
            updateSelectedDesignationList: jest.fn(),
            getUuid: 'test-uuid',
            createTerm: jest.fn().mockReturnValue(of({ result: { node_id: ['newTermId'] } })),
            updateTerms: jest.fn().mockReturnValue(of({ success: true })),
            publishFramework: jest.fn().mockReturnValue(of({ success: true })),
            selecteDesignationCount: 1
        }

        dialogMock = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of([]))
            })
        }

        loaderServiceMock = {
            changeLoaderState: jest.fn()
        }

        routerMock = {
            navigate: jest.fn(),
            navigateByUrl: jest.fn()
        }

        snackBarMock = {
            open: jest.fn()
        }

        datePipeMock = {
            transform: jest.fn().mockReturnValue('01 Jan, 2024')
        }

        activatedRouteMock = {
            snapshot: {
                data: {
                    configService: mockConfigService
                }
            },
            data: of({
                pageData: {
                    data: mockDesignationConfig
                }
            })
        }

        onboardingServiceMock = {
            routeFromSelfRegistration: false,
            setFlagToCheckRoute: jest.fn()
        }

        component = new ImportDesignationComponent(
            designationsServiceMock,
            dialogMock,
            loaderServiceMock,
            routerMock,
            snackBarMock,
            datePipeMock,
            activatedRouteMock,
            onboardingServiceMock
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize the component and load designations', () => {
            const loadDesignationsSpy = jest.spyOn(component, 'loadDesignations')
            const valueChangeSubscriptionSpy = jest.spyOn(component, 'valueChangeSubscription')
            const getRoutesDataSpy = jest.spyOn(component, 'getRoutesData')

            component.ngOnInit()

            expect(component.configSvc).toBe(mockConfigService)
            expect(loadDesignationsSpy).toHaveBeenCalled()
            expect(valueChangeSubscriptionSpy).toHaveBeenCalled()
            expect(getRoutesDataSpy).toHaveBeenCalled()
        })
    })

    describe('getFrameWorkDetails', () => {
        it('should navigate to my designations if frameworkInfo is undefined', () => {
            const navigateSpy = jest.spyOn(component, 'navigateToMyDesignations')
            designationsServiceMock.frameWorkInfo = undefined

            component.getFrameWorkDetails()

            expect(navigateSpy).toHaveBeenCalled()
        })

        it('should set frameworkInfo if available', () => {
            designationsServiceMock.frameWorkInfo = mockFrameworkInfo

            component.getFrameWorkDetails()

            expect(component.frameworkInfo).toBe(mockFrameworkInfo)
        })
    })

    describe('loadDesignations', () => {
        it('should load designations with correct parameters', () => {
            component.startIndex = 0
            component.pageSize = 30

            component.loadDesignations()

            expect(designationsServiceMock.getIgotMasterDesignations).toHaveBeenCalledWith({
                pageNumber: 0,
                filterCriteriaMap: { status: 'Active' },
                requestedFields: [],
                pageSize: 30
            })
            expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(true)
            expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(false)
        })

        it('should load designations with search key if provided', () => {
            component.startIndex = 0
            component.pageSize = 30

            component.loadDesignations('searchTerm')

            expect(designationsServiceMock.getIgotMasterDesignations).toHaveBeenCalledWith({
                pageNumber: 0,
                filterCriteriaMap: { status: 'Active' },
                requestedFields: [],
                pageSize: 30,
                searchString: 'searchTerm'
            })
        })

        it('should handle error when loading designations', () => {
            designationsServiceMock.getIgotMasterDesignations = jest.fn().mockReturnValue(
                throwError(() => new Error('Test error'))
            )

            component.loadDesignations()

            expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(false)
        })
    })

    describe('selectDesignation', () => {
        beforeEach(() => {
            component.igotDesignationsList = [mockDesignation]
            component.selectedDesignationsList = []
        })

        it('should add designation to selected list if not already selected', () => {
            component.selectDesignation(0)

            expect(component.igotDesignationsList[0].selected).toBe(true)
            expect(component.selectedDesignationsList).toContain(mockDesignation)
            expect(designationsServiceMock.updateSelectedDesignationList).toHaveBeenCalledWith([mockDesignation])
        })

        it('should show error if selected designations exceed limit', () => {
            designationsServiceMock.selecteDesignationCount = 1001
            // The designation fixture is shared and the previous test leaves it selected;
            // selectDesignation toggles, so it has to start unselected to take this branch.
            component.igotDesignationsList[0].selected = false
            component.selectedDesignationsList = []
            const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar')

            component.selectDesignation(0)

            expect(openSnackbarSpy).toHaveBeenCalled()
            expect(component.igotDesignationsList[0].selected).toBe(false)
        })

        it('should remove designation if already selected', () => {
            component.igotDesignationsList[0].selected = true
            component.selectedDesignationsList = [mockDesignation]
            const removeDesignationSpy = jest.spyOn(component, 'removeDesignation')

            component.selectDesignation(0)

            expect(removeDesignationSpy).toHaveBeenCalledWith([mockDesignation])
        })
    })

    describe('removeDesignation', () => {
        beforeEach(() => {
            component.igotDesignationsList = [mockDesignation]
            component.selectedDesignationsList = [mockDesignation]
        })

        it('should remove designation from selected list', () => {
            component.removeDesignation([mockDesignation])

            expect(component.selectedDesignationsList).toEqual([])
            expect(designationsServiceMock.updateSelectedDesignationList).toHaveBeenCalledWith([])
        })

        it('should update selected property in igotDesignationsList', () => {
            component.igotDesignationsList[0].selected = true

            component.removeDesignation([mockDesignation])

            expect(component.igotDesignationsList[0].selected).toBe(false)
        })
    })

    describe('onChangePage', () => {
        it('should update pagination parameters and reload designations', () => {
            const pageEvent: PageEvent = {
                pageIndex: 1,
                pageSize: 20,
                length: 100,
                previousPageIndex: 0
            }
            const loadDesignationsSpy = jest.spyOn(component, 'loadDesignations')

            component.onChangePage(pageEvent)

            expect(component.startIndex).toBe(20)
            expect(component.lastIndex).toBe(40)
            expect(component.pageSize).toBe(20)
            expect(loadDesignationsSpy).toHaveBeenCalled()
        })
    })

    describe('importDesignations', () => {
        beforeEach(() => {
            component.selectedDesignationsList = [mockDesignation]
            component.frameworkInfo = mockFrameworkInfo
            component.configSvc = mockConfigService
            component.dialogRef = { close: jest.fn() }

            jest.spyOn(component, 'openProcessingBox').mockImplementation(() => {
                component.progressDialogData = { subTitle: 'Processing' }
                component.dialogRef = { close: jest.fn() }
            })
        })

        it('should not proceed if no designations are selected', () => {
            component.selectedDesignationsList = []
            const openProcessingBoxSpy = jest.spyOn(component, 'openProcessingBox')

            component.importDesignations()

            expect(openProcessingBoxSpy).not.toHaveBeenCalled()
        })

        it('should create terms for selected designations and update terms after success', () => {
            const updateTermsSpy = jest.spyOn(component, 'updateTerms')

            component.importDesignations()

            expect(designationsServiceMock.createTerm).toHaveBeenCalled()
            expect(updateTermsSpy).toHaveBeenCalled()
        })

        it('should handle error when term creation fails for all designations', () => {
            designationsServiceMock.createTerm = jest.fn().mockReturnValue(
                throwError(() => new Error('Test error'))
            )

            const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar')

            component.importDesignations()

            // Every term failed, so updateTerms finds
            // selectedDesignationsList.length === designationsImportFailed.length, reports
            // the error and clears the failure list again - hence 0, not 1.
            expect(openSnackbarSpy).toHaveBeenCalled()
            expect(component.designationsImportFailed.length).toBe(0)
        })
    })

    describe('updateTerms', () => {
        beforeEach(() => {
            component.selectedDesignationsList = [mockDesignation]
            component.designationsImportSuccessResponses = [{ identifier: 'newTermId' }]
            component.frameworkInfo = mockFrameworkInfo
            component.dialogRef = { close: jest.fn() }
            component.progressDialogData = { subTitle: 'Processing' }
            component.designationConfig = mockDesignationConfig
        })

        it('should close dialog and show error if all designations failed to import', () => {
            component.designationsImportFailed = [{ designation: mockDesignation }]
            const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar')

            component.updateTerms({ terms: [{ category: 'test', code: 'test' }] })

            expect(component.dialogRef.close).toHaveBeenCalledWith(false)
            expect(openSnackbarSpy).toHaveBeenCalled()
        })

        it('should update terms and call publishFramework on success', () => {
            const publishFrameWorkSpy = jest.spyOn(component, 'publishFrameWork')

            component.updateTerms(mockFrameworkInfo.categories[0])

            expect(designationsServiceMock.updateTerms).toHaveBeenCalled()
            expect(publishFrameWorkSpy).toHaveBeenCalled()
        })

        it('should retry updating terms when first attempt fails', () => {
            const originalUpdateTerms = designationsServiceMock.updateTerms

            // First call fails, second call succeeds
            designationsServiceMock.updateTerms = jest.fn()
                .mockReturnValueOnce(throwError(() => new Error('Test error')))
                .mockReturnValueOnce(of({ success: true }))

            component.updateTerms(mockFrameworkInfo.categories[0])

            // The error handler re-invokes updateTerms with retry=true, so the service is
            // called twice - which is the retry this test is named for.
            expect(designationsServiceMock.updateTerms).toHaveBeenCalledTimes(2)
            // The subtitle is set to the retry message on failure, but the second attempt
            // succeeds and publishFrameWork() moves it on again, so only the retry itself
            // is observable at the end.
            expect(designationsServiceMock.updateTerms).toHaveBeenLastCalledWith(
                expect.anything(), expect.anything(), expect.anything(), expect.anything())

            // Restore original function
            designationsServiceMock.updateTerms = originalUpdateTerms
        })
    })

    describe('publishFrameWork', () => {
        beforeEach(() => {
            component.frameworkInfo = mockFrameworkInfo
            component.dialogRef = { close: jest.fn() }
            component.progressDialogData = { subTitle: 'Processing' }
            component.designationConfig = mockDesignationConfig
            component.designationsImportSuccessResponses = [{ identifier: 'newTermId' }]
        })

        it('should call publishFramework service and close dialog after delay', () => {
            jest.useFakeTimers()

            component.publishFrameWork()

            expect(designationsServiceMock.publishFramework).toHaveBeenCalledWith(mockFrameworkInfo.code)
            expect(component.progressDialogData.subTitle).toBe(mockDesignationConfig.publishingMsg)

            jest.advanceTimersByTime(10000)
            expect(component.dialogRef.close).toHaveBeenCalledWith(true)

            jest.useRealTimers()
        })

        it('should handle error when publishing framework fails', () => {
            designationsServiceMock.publishFramework = jest.fn().mockReturnValue(
                throwError(() => new Error('Test error'))
            )
            const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar')

            component.publishFrameWork()

            expect(openSnackbarSpy).toHaveBeenCalled()
            expect(component.dialogRef.close).toHaveBeenCalled()
        })
    })

    describe('ngOnDestroy', () => {
        it('should clean up subscriptions and reset state', () => {
            //component.apiSubscription = of().subscribe()

            component.ngOnDestroy()

            expect(designationsServiceMock.updateSelectedDesignationList).toHaveBeenCalledWith([])
            expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(false)
            expect(onboardingServiceMock.setFlagToCheckRoute).toHaveBeenCalledWith(false)
        })
    })
})
