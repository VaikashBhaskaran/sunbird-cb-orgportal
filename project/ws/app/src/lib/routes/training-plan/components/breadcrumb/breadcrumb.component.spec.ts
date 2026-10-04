import { BreadcrumbComponent } from './breadcrumb.component'
import { TrainingPlanContent } from '../../models/training-plan.model'
import { of, Subject } from 'rxjs'

describe('BreadcrumbComponent', () => {
    let component: BreadcrumbComponent
    let mockRouter: any
    let mockActivatedRoute: any
    let mockDialog: any
    let mockTpdsSvc: any
    let mockTpSvc: any
    let mockSnackBar: any
    let mockDialogRef: any
    let mockConfigSvc: any

    beforeEach(() => {
        mockDialogRef = {
            afterClosed: jest.fn().mockReturnValue(of('confirmed')),
            close: jest.fn()
        }

        mockRouter = {
            navigate: jest.fn(),
            navigateByUrl: jest.fn()
        }

        mockActivatedRoute = {
            snapshot: {
                data: {
                    contentData: null
                }
            }
        }

        mockDialog = {
            open: jest.fn().mockReturnValue(mockDialogRef)
        }

        mockTpdsSvc = {
            trainingPlanTitle: 'Test Title',
            // Leaving the access-settings step tells the step's own component to save
            // through this Subject.
            saveAccessControlAndContinue: new Subject<void>(),
            trainingPlanStepperData: {
                name: '',
                status: 'draft',
                assignmentType: 'AllUser',
                assignmentTypeInfo: [],
                contentList: [],
                endDate: null
            },
            getContentList: () => mockTpdsSvc.trainingPlanStepperData.contentList || [],
            getMandatoryContentCount: () => (mockTpdsSvc.trainingPlanStepperData.contentList || [])
                .filter((item: any) => !!(item && item.mandatory)).length,
            // The plan content list is sent as { identifier, mandatory } entries
            buildContentListPayload: (contentList: any[]) => (contentList || []).map((item: any) => (
                (typeof item === 'string')
                    ? { identifier: item, mandatory: false }
                    : { identifier: item.identifier, mandatory: !!item.mandatory }
            ))
        }

        // the v1 and v2 plan apis are gone, the component talks to v3
        mockTpSvc = {
            createPlanV4: jest.fn().mockReturnValue(of({ success: true })),
            updatePlanV4: jest.fn().mockReturnValue(of({ success: true })),
            publishPlanV4: jest.fn().mockReturnValue(of({ params: { status: 'success' } })),
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockConfigSvc = {
            userProfile: { rootOrgId: 'org-1' },
            unMappedUser: { rootOrgId: 'org-1' },
            orgReadData: { isCCA: false }
        }

        component = new BreadcrumbComponent(
            mockRouter,
            mockActivatedRoute,
            mockDialog,
            mockTpdsSvc,
            mockTpSvc,
            mockSnackBar,
            mockConfigSvc
        )
    })

    it('should initialize with default values', () => {
        expect(component.showBreadcrumbAction).toBe(true)
        expect(component.selectedTab).toBe('')
        expect(component.editState).toBe(false)
        expect(component.isLiveContent).toBe(false)
    })

    describe('ngOnInit', () => {
        it('should set editState to false when contentData is not present', () => {
            component.ngOnInit()
            expect(component.editState).toBe(false)
        })

        it('should set editState to true when contentData is present', () => {
            mockActivatedRoute.snapshot.data.contentData = { status: 'draft' }
            component.ngOnInit()
            expect(component.editState).toBe(true)
            expect(component.contentData).toEqual({ status: 'draft' })
        })

        it('should set isLiveContent to true when content status is live', () => {
            mockActivatedRoute.snapshot.data.contentData = { status: 'live' }
            component.ngOnInit()
            expect(component.isLiveContent).toBe(true)
        })
    })

    describe('cancel', () => {
        it('should reset training plan title and navigate to dashboard', () => {
            jest.useFakeTimers()

            component.cancel()
            expect(mockTpdsSvc.trainingPlanTitle).toBe('')

            jest.advanceTimersByTime(500)
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('app/home/training-plan-dashboard')

            jest.useRealTimers()
        })
    })

    describe('nextStep', () => {
        it('should emit CREATE_PLAN to ADD_CONTENT', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.CREATE_PLAN
            component.changeToNextTab = { emit: jest.fn() } as any

            component.nextStep()

            expect(component.changeToNextTab.emit).toHaveBeenCalledWith(TrainingPlanContent.TTabLabelKey.ADD_CONTENT)
        })

        it('should emit ADD_CONTENT to ADD_ACCESS_SETTINGS', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_CONTENT
            component.changeToNextTab = { emit: jest.fn() } as any

            component.nextStep()

            expect(component.changeToNextTab.emit)
                .toHaveBeenCalledWith(TrainingPlanContent.TTabLabelKey.ADD_ACCESS_SETTINGS)
        })

        // An APAR plan with no gating course is one whose comprehensive assessment unlocks straight
        // away, so the step is not left until the author has been told
        it('should warn before leaving ADD_CONTENT when an APAR plan gates nothing', () => {
            mockTpdsSvc.trainingPlanStepperData.isApar = true
            mockTpdsSvc.trainingPlanStepperData.contentList = [{ identifier: 'do_1', mandatory: false }]
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_CONTENT
            component.changeToNextTab = { emit: jest.fn() } as any

            component.nextStep()

            expect(mockDialog.open).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    data: expect.objectContaining({ type: 'warning' }),
                })
            )
            // the mocked box answers 'confirmed', the author carried on
            expect(component.changeToNextTab.emit)
                .toHaveBeenCalledWith(TrainingPlanContent.TTabLabelKey.ADD_ACCESS_SETTINGS)
        })

        it('should stay on ADD_CONTENT when the gating warning is dismissed', () => {
            mockDialogRef.afterClosed = jest.fn().mockReturnValue(of('Go back'))
            mockTpdsSvc.trainingPlanStepperData.isApar = true
            mockTpdsSvc.trainingPlanStepperData.contentList = [{ identifier: 'do_1', mandatory: false }]
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_CONTENT
            component.changeToNextTab = { emit: jest.fn() } as any

            component.nextStep()

            expect(component.changeToNextTab.emit).not.toHaveBeenCalled()
        })

        it('should leave ADD_CONTENT without warning when an APAR plan gates something', () => {
            mockTpdsSvc.trainingPlanStepperData.isApar = true
            mockTpdsSvc.trainingPlanStepperData.contentList = [{ identifier: 'do_1', mandatory: true }]
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_CONTENT
            component.changeToNextTab = { emit: jest.fn() } as any

            component.nextStep()

            expect(mockDialog.open).not.toHaveBeenCalled()
            expect(component.changeToNextTab.emit)
                .toHaveBeenCalledWith(TrainingPlanContent.TTabLabelKey.ADD_ACCESS_SETTINGS)
        })

        it('should ask the access settings step to save before leaving it', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_ACCESS_SETTINGS
            component.changeToNextTab = { emit: jest.fn() } as any
            const saveAndContinue = jest.spyOn(mockTpdsSvc.saveAccessControlAndContinue, 'next')

            component.nextStep()

            // Leaving this step is not a direct tab change: the breadcrumb signals through
            // the service and the access settings component saves, then advances.
            expect(saveAndContinue).toHaveBeenCalled()
            expect(component.changeToNextTab.emit).not.toHaveBeenCalled()
        })

        it('should call createPlanDraftView when on ADD_TIMELINE tab', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_TIMELINE
            component.createPlanDraftView = jest.fn()

            component.nextStep()

            expect(component.createPlanDraftView).toHaveBeenCalled()
        })
    })

    describe('changeTabFromBreadCrumb', () => {
        it('should emit CREATE_PLAN when item is CREATE_PLAN', () => {
            component.changeToNextTab = { emit: jest.fn() } as any

            component.changeTabFromBreadCrumb(TrainingPlanContent.TTabLabelKey.CREATE_PLAN)

            expect(component.changeToNextTab.emit).toHaveBeenCalledWith(TrainingPlanContent.TTabLabelKey.CREATE_PLAN)
        })
    })

    describe('performRoute', () => {
        it('should navigate to training-plan-dashboard with query params when route is list and editState is true', () => {
            component.editState = true
            mockTpdsSvc.trainingPlanStepperData = {
                status: 'draft',
                assignmentType: 'AllUser'
            }

            component.performRoute('list')

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['app', 'home', 'training-plan-dashboard'],
                {
                    queryParams: {
                        type: 'draft',
                        tabSelected: 'AllUser'
                    }
                }
            )
        })

        it('should navigate to training-plan-dashboard when route is list and editState is false', () => {
            component.editState = false

            component.performRoute('list')

            expect(mockRouter.navigate).toHaveBeenCalledWith(['app', 'home', 'training-plan-dashboard'])
        })

        it('should navigate to specified route when route is not list', () => {
            component.performRoute('create')

            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('app/training-plan/create')
        })
    })

    describe('showDialogBox', () => {
        it('should open dialog with progress data', () => {
            component.openDialoagBox = jest.fn()

            component.showDialogBox('progress')

            expect(component.openDialoagBox).toHaveBeenCalledWith({
                type: 'progress',
                icon: 'vega',
                title: 'Processing your request',
                subTitle: 'Wait a second , your request is processing………'
            })
        })

        it('should open dialog with progress-completed data', () => {
            component.openDialoagBox = jest.fn()

            component.showDialogBox('progress-completed')

            expect(component.openDialoagBox).toHaveBeenCalledWith({
                type: 'progress-completed',
                icon: 'accept_icon',
                title: 'Your processing has been done.',
                subTitle: 'Updated to Draft',
                primaryAction: 'Redirecting....'
            })
        })
    })

    describe('openDialoagBox', () => {
        it('should open dialog with provided data', () => {
            const dialogData = {
                type: 'test',
                icon: 'test-icon',
                title: 'Test Title',
                subTitle: 'Test Subtitle',
                primaryAction: 'Test Primary',
                secondaryAction: 'Test Secondary'
            }

            component.openDialoagBox(dialogData)

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                disableClose: true,
                data: dialogData,
                autoFocus: false
            })
        })
    })

    describe('hideConfirmationBox', () => {
        it('should close dialog', () => {
            component.dialogRef = mockDialogRef

            component.hideConfirmationBox()

            expect(mockDialogRef.close).toHaveBeenCalled()
        })
    })

    describe('createPlanDraftView', () => {
        it('should create plan and navigate to dashboard on success', () => {
            jest.useFakeTimers()
            mockTpdsSvc.trainingPlanTitle = 'Test Plan'
            mockTpdsSvc.trainingPlanStepperData = {
                name: '',
                status: 'draft',
                assignmentType: 'AllUser'
            }
            component.showDialogBox = jest.fn()
            component.dialogRef = mockDialogRef

            component.createPlanDraftView()

            expect(component.showDialogBox).toHaveBeenCalledWith('progress')
            expect(mockTpSvc.createPlanV4).toHaveBeenCalledWith({
                request: expect.objectContaining({
                    name: 'Test Plan',
                    status: 'draft',
                    orgIdList: ['org-1']
                })
            })
            expect(mockDialogRef.close).toHaveBeenCalled()
            expect(component.showDialogBox).toHaveBeenCalledWith('progress-completed')

            jest.advanceTimersByTime(1000)

            expect(mockDialogRef.close).toHaveBeenCalled()
            expect(mockTpdsSvc.trainingPlanTitle).toBe('')
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['app', 'home', 'training-plan-dashboard'],
                {
                    queryParams: {
                        type: 'draft',
                        tabSelected: 'AllUser'
                    }
                }
            )

            jest.useRealTimers()
        })
    })

    describe('checkIfDisabled', () => {
        it('should return validation status for CREATE_PLAN tab', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.CREATE_PLAN
            component.validationList = {
                titleIsInvalid: false
            }

            const result = component.checkIfDisabled()

            expect(result).toBe(false)
        })

        it('should return validation status for ADD_CONTENT tab', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_CONTENT
            component.validationList = {
                addContentIsInvalid: false
            }

            const result = component.checkIfDisabled()

            expect(result).toBe(false)
        })

        it('should return validation status for ADD_ASSIGNEE tab', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_ASSIGNEE
            component.validationList = {
                addAssigneeIsInvalid: false
            }

            const result = component.checkIfDisabled()

            expect(result).toBe(false)
        })

        it('should return true for any other tab', () => {
            component.selectedTab = 'unknown'

            const result = component.checkIfDisabled()

            expect(result).toBe(true)
        })
    })

    describe('generateRequestPayload', () => {
        const stepperData = (aparYear?: string) => ({
            name: 'Test Plan',
            contentList: ['c1'],
            contentType: 'Course',
            endDate: '2027-03-31',
            isApar: true,
            status: 'draft',
            accessControl: { userGroups: [], version: 1 },
            aparYear
        })

        it('should send the selected year as planYear on create', () => {
            const payload = component.generateRequestPayload(stepperData('2026-27'), 'create')

            expect(payload.request.planYear).toBe('2026-27')
            expect(payload.request).toEqual({
                orgIdList: ['org-1'],
                comment: 'cbPlanId1 is created',
                contentList: [{ identifier: 'c1', mandatory: false }],
                contentType: 'Course',
                contextData: { accessControl: { userGroups: [], version: 1 } },
                endDate: '2027-03-31',
                isApar: true,
                name: 'Test Plan',
                planYear: '2026-27',
                status: 'draft'
            })
        })

        it('should send the selected year as planYear on update', () => {
            mockActivatedRoute.snapshot.data.contentData = { id: 'plan-123', status: 'draft' }

            const payload = component.generateRequestPayload(stepperData('2025-26'), 'update')

            expect(payload.request.planYear).toBe('2025-26')
            expect(payload.request.id).toBe('plan-123')
        })

        it('should carry the year the timeline step last picked', () => {
            mockTpdsSvc.trainingPlanStepperData = stepperData('2024-25')

            const payload = component.generateRequestPayload(mockTpdsSvc.trainingPlanStepperData, 'create')

            expect(payload.request.planYear).toBe('2024-25')
        })

        it('should leave planYear unset when no year reached the stepper', () => {
            const payload = component.generateRequestPayload(stepperData(), 'create')

            expect(payload.request.planYear).toBeUndefined()
        })

        it('should return null for an unknown payload type', () => {
            expect(component.generateRequestPayload(stepperData('2026-27'), 'archive')).toBeNull()
        })
    })

})