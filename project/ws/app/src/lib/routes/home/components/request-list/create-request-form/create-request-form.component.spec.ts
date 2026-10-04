import { environment } from 'src/environments/environment'
import { CreateRequestFormComponent } from './create-request-form.component'
import { UntypedFormBuilder } from '@angular/forms'
import { of, throwError } from 'rxjs'

// Mock services and components
jest.mock('../../../services/home.servive')
jest.mock('../../../../training-plan/components/confirmation-box/confirmation.box.component')
jest.mock('../competency-view/competency-view.component')

describe('CreateRequestFormComponent', () => {
    let component: CreateRequestFormComponent
    let formBuilder: UntypedFormBuilder
    let homeServiceMock: any
    let activatedRouterMock: any
    let snackBarMock: any
    let routerMock: any
    let dialogMock: any
    let initServiceMock: any

    beforeEach(() => {
        // Setup mocks
        formBuilder = new UntypedFormBuilder()

        homeServiceMock = {
            getRequestTypeList: jest.fn().mockReturnValue(of([])),
            getFilterEntity: jest.fn().mockReturnValue(of([])),
            getFilterEntityV2: jest.fn().mockReturnValue(of([
                { terms: [] },
                { terms: [] }
            ])),
            getRequestDataById: jest.fn().mockReturnValue(of({})),
            createDemand: jest.fn().mockReturnValue(of({}))
        }

        activatedRouterMock = {
            snapshot: {
                data: {
                    configService: {
                        userProfile: {
                            userId: 'test-user-id'
                        }
                    }
                }
            },
            queryParams: of({})
        }

        snackBarMock = {
            open: jest.fn()
        }

        routerMock = {
            navigateByUrl: jest.fn()
        }

        dialogMock = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of({}))
            })
        }

        initServiceMock = {
            configSvc: {
                // The component reads `compentency` (spelled that way in the source) indexed
                // by environment.compentencyVersionKey, which setup-jest's environment mock
                // leaves undefined - hence the computed key rather than a literal 'v5'.
                compentency: {
                    [environment.compentencyVersionKey]: { vKey: 'competencies_v5' }
                }
            }
        }

        // Create component
        component = new CreateRequestFormComponent(
            formBuilder,
            homeServiceMock,
            activatedRouterMock,
            snackBarMock,
            routerMock,
            dialogMock,
            initServiceMock
        )
        // Methods under test read compentencyKey, which ngOnInit populates.
        component.compentencyKey = { vKey: 'competencies_v5' } as any
        // initFromGroup builds requestForm with a control named after compentencyKey.vKey,
        // so it has to run after the key is set for tests that touch that control.
        component.initFromGroup()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize form and fetch data', () => {
            const initFromGroupSpy = jest.spyOn(component, 'initFromGroup')
            const getRequestTypeListSpy = jest.spyOn(component, 'getRequestTypeList')
            const valuechangeFuctionsSpy = jest.spyOn(component, 'valuechangeFuctions')

            component.ngOnInit()

            expect(initFromGroupSpy).toHaveBeenCalled()
            expect(getRequestTypeListSpy).toHaveBeenCalled()
            expect(component.userId).toBe('test-user-id')
            expect(valuechangeFuctionsSpy).toHaveBeenCalled()
        })

        it('should get competency data with v5 key', () => {
            component.compentencyKey = { vKey: 'competencies_v5', vCompetencyArea: '', vCompetencyAreaDescription: '', vCompetencyTheme: '', vCompetencySubTheme: '' }
            const getFilterEntitySpy = jest.spyOn(component, 'getFilterEntity')

            component.ngOnInit()

            expect(getFilterEntitySpy).toHaveBeenCalled()
        })

        it('should get competency data with non-v5 key', () => {
            // The v2 fetch is the branch taken for anything other than competencies_v5.
            // ngOnInit re-reads compentencyKey off the init service, so setting it on the
            // component here would be overwritten - the service's value is what counts.
            initServiceMock.configSvc.compentency[environment.compentencyVersionKey] = {
                vKey: 'competencies',
            }
            const getFilterEntityV2Spy = jest.spyOn(component, 'getFilterEntityV2')

            component.ngOnInit()

            expect(getFilterEntityV2Spy).toHaveBeenCalled()
        })

        it('should handle query params with id and name', () => {
            activatedRouterMock.queryParams = of({ id: '123', name: 'view' })

            component.ngOnInit()

            expect(component.demandId).toBe('123')
            expect(component.actionBtnName).toBe('view')
        })
    })

    describe('initFromGroup', () => {
        it('should initialize form with correct controls', () => {
            component.initFromGroup()

            expect(component.requestForm).toBeDefined()
            expect(component.requestForm.controls['TitleName']).toBeDefined()
            expect(component.requestForm.controls['Objective']).toBeDefined()
            expect(component.requestForm.controls['requestType']).toBeDefined()
        })
    })

    describe('getRequestTypeList', () => {
        it('should get request types and handle view mode', () => {
            const testData = [{ id: '1', orgName: 'Test Org' }]
            homeServiceMock.getRequestTypeList.mockReturnValue(of(testData))
            component.demandId = '123'
            component.actionBtnName = 'view'
            const getRequestDataByIdSpy = jest.spyOn(component, 'getRequestDataById')

            component.getRequestTypeList()

            expect(homeServiceMock.getRequestTypeList).toHaveBeenCalled()
            expect(component.requestTypeData).toEqual(testData)
            expect(component.filteredRequestType).toEqual(testData)
            expect(component.filteredAssigneeType).toEqual(testData)
            expect(getRequestDataByIdSpy).toHaveBeenCalled()
            expect(component.isHideData).toBe(true)
            expect(component.isCompetencyHide).toBe(true)
        })

        it('should handle reassign mode', () => {
            const testData = [{ id: '1', orgName: 'Test Org' }]
            homeServiceMock.getRequestTypeList.mockReturnValue(of(testData))
            component.demandId = '123'
            component.actionBtnName = 'reassign'
            component.requestForm = formBuilder.group({
                assigneeText: [''],
                assignee: ['']
            })

            component.getRequestTypeList()

            expect(component.isCompetencyHide).toBe(true)
            // Check that specific form controls are enabled
            expect(component.requestForm.controls['assigneeText'].enabled).toBe(true)
            expect(component.requestForm.controls['assignee'].enabled).toBe(true)
        })
    })

    describe('selectRequestType', () => {
        beforeEach(() => {
            component.requestForm = formBuilder.group({
                providers: [''],
                assignee: ['']
            })
        })

        it('should handle Single request type', () => {
            component.selectRequestType('Single')

            expect(component.isAssignee).toBe(true)
            expect(component.isBroadCast).toBe(false)
            expect(component.statusValue).toBe('Assigned')
            expect(component.requestForm.controls['assignee'].hasValidator).toBeTruthy()
        })

        it('should handle Broadcast request type', () => {
            component.selectRequestType('Broadcast')

            expect(component.isBroadCast).toBe(true)
            expect(component.isAssignee).toBe(false)
            expect(component.statusValue).toBe('Unassigned')
            expect(component.requestForm.controls['providers'].hasValidator).toBeTruthy()
        })
    })

    describe('getFilterEntity', () => {
        it('should fetch and store competency data', () => {
            const mockData = [{ name: 'Comp1', children: [] }]
            homeServiceMock.getFilterEntity.mockReturnValue(of(mockData))

            component.getFilterEntity()

            expect(homeServiceMock.getFilterEntity).toHaveBeenCalled()
            expect(component.competencyList).toEqual(mockData)
            expect(component.allCompetencies).toEqual(mockData)
            expect(component.filteredallCompetencies).toEqual(mockData)
        })
    })

    describe('getFilterEntityV2', () => {
        it('should fetch and structure v2 competency data', () => {
            const mockResponse = [
                { terms: [{ name: 'Area1', identifier: 'a1', associations: [{ identifier: 't1' }] }] },
                { terms: [{ identifier: 't1', name: 'Theme1', associations: [], hasOwnProperty: () => true }] }
            ]
            homeServiceMock.getFilterEntityV2.mockReturnValue(of(mockResponse))

            component.getFilterEntityV2()

            expect(homeServiceMock.getFilterEntityV2).toHaveBeenCalled()
            expect(component.allCompetencies.length).toBeGreaterThan(0)
            expect(component.filteredallCompetencies).toEqual(component.allCompetencies)
        })
    })

    describe('addCompetency', () => {
        beforeEach(() => {
            component.requestForm = formBuilder.group({
                competencies_v5: [[]]
            })
            component.compentencyKey = { vKey: 'competencies_v5', vCompetencyArea: '', vCompetencyAreaDescription: '', vCompetencyTheme: '', vCompetencySubTheme: '' }
            component.seletedCompetencyArea = { name: 'Area1', id: 'a1', description: 'Desc1' }
            component.seletedCompetencyTheme = {
                name: 'Theme1',
                id: 't1',
                description: 'ThemeDesc',
                additionalProperties: { themeType: 'type1' }
            }
            component.seletedCompetencySubTheme = {
                name: 'SubTheme1',
                id: 's1',
                description: 'SubDesc'
            }
        })

        it('should add competency to form control for v5', () => {
            const resetCompfieldsSpy = jest.spyOn(component, 'resetCompfields').mockImplementation(() => { })
            const refreshDataSpy = jest.spyOn(component, 'refreshData').mockImplementation(() => { })

            component.addCompetency()

            const formValue = component.requestForm.controls['competencies_v5'].value
            expect(formValue.length).toBe(1)
            expect(formValue[0].competencyArea).toBe('Area1')
            expect(formValue[0].competencyTheme).toBe('Theme1')
            expect(formValue[0].competencySubTheme).toBe('SubTheme1')
            expect(resetCompfieldsSpy).toHaveBeenCalled()
            expect(refreshDataSpy).toHaveBeenCalled()
        })

        it('should not add duplicate competency', () => {
            const existingComp = {
                competencyAreaId: 'a1',
                competencyThemeId: 't1',
                competencySubThemeId: 's1'
            }
            component.requestForm.controls['competencies_v5'].setValue([existingComp])
            // Both addCompetency branches end in resetCompfields, which clears these.
            const resetCompfieldsSpy = jest.spyOn(component, 'resetCompfields').mockImplementation(() => { })

            component.addCompetency()

            expect(resetCompfieldsSpy).toHaveBeenCalled()

            expect(snackBarMock.open).toHaveBeenCalledWith('This competency is already added')
            expect(component.requestForm.controls['competencies_v5'].value.length).toBe(1)
        })
    })

    describe('removeCompetency', () => {
        beforeEach(() => {
            component.requestForm = formBuilder.group({
                competencies_v5: [[]]
            })
            component.compentencyKey = { vKey: 'competencies_v5', vCompetencyArea: '', vCompetencyAreaDescription: '', vCompetencyTheme: '', vCompetencySubTheme: '' }
        })

        it('should remove competency by id', () => {
            const mockItem = { id: 'comp1' }
            component.requestForm.controls['competencies_v5'].setValue([mockItem])
            const refreshDataSpy = jest.spyOn(component, 'refreshData').mockImplementation(() => { })

            component.removeCompetency(mockItem)

            expect(component.requestForm.controls['competencies_v5'].value.length).toBe(0)
            expect(refreshDataSpy).toHaveBeenCalled()
        })

        it('should remove competency by matching properties', () => {
            const mockItem = {
                competencyAreaId: 'a1',
                competencyThemeId: 't1',
                competencySubThemeId: 's1'
            }
            component.requestForm.controls['competencies_v5'].setValue([mockItem])
            const refreshDataSpy = jest.spyOn(component, 'refreshData').mockImplementation(() => { })

            component.removeCompetency(mockItem)

            expect(component.requestForm.controls['competencies_v5'].value.length).toBe(0)
            expect(refreshDataSpy).toHaveBeenCalled()
        })
    })

    describe('showConformationPopUp', () => {
        it('should open dialog and call submit if confirmed', () => {
            const submitSpy = jest.spyOn(component, 'submit').mockImplementation(() => { })
            dialogMock.open.mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of('confirmed'))
            })

            component.showConformationPopUp()

            expect(dialogMock.open).toHaveBeenCalled()
            expect(submitSpy).toHaveBeenCalled()
        })

        it('should not call submit if canceled', () => {
            const submitSpy = jest.spyOn(component, 'submit').mockImplementation(() => { })
            dialogMock.open.mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of('canceled'))
            })

            component.showConformationPopUp()

            expect(dialogMock.open).toHaveBeenCalled()
            expect(submitSpy).not.toHaveBeenCalled()
        })
    })

    describe('submit', () => {
        beforeEach(() => {
            component.requestForm = formBuilder.group({
                TitleName: ['Test Title'],
                Objective: ['Test Objective'],
                userType: ['Test User'],
                learningMode: ['Self-paced'],
                competencies_v5: [[]],
                referenceLink: ['test.com'],
                providers: [[]],
                requestType: ['Single'],
                assignee: [{ orgName: 'Org1', id: 'org1' }]
            })
            component.compentencyKey = { vKey: 'competencies_v5', vCompetencyArea: '', vCompetencyAreaDescription: '', vCompetencyTheme: '', vCompetencySubTheme: '' }
            component.isAssignee = true
            component.showDialogBox = jest.fn()

            dialogMock.open.mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of({})),
                close: jest.fn()
            })
            component.dialogRefs = dialogMock.open()
        })

        it('should create demand with correct data', () => {
            homeServiceMock.createDemand.mockReturnValue(of({ id: 'demand1' }))
            jest.useFakeTimers()

            component.submit()

            expect(homeServiceMock.createDemand).toHaveBeenCalled()
            expect(component.showDialogBox).toHaveBeenCalledWith('progress')

            // Fast-forward timers
            jest.runAllTimers()

            expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/app/home/request-list')
            expect(snackBarMock.open).toHaveBeenCalledWith('Request submitted successfully ')
            jest.useRealTimers()
        })

        it('should handle error when creating demand', () => {
            homeServiceMock.createDemand.mockReturnValue(throwError({ error: 'Failed' }))

            component.submit()

            expect(homeServiceMock.createDemand).toHaveBeenCalled()
            expect(snackBarMock.open).toHaveBeenCalledWith('Request Failed')
        })

        it('should handle reassign with demand id', () => {
            component.demandId = '123'
            component.actionBtnName = 'reassign'

            component.submit()

            const requestArg = homeServiceMock.createDemand.mock.calls[0][0]
            expect(requestArg.demand_id).toBe('123')
        })
    })

    describe('getRequestDataById', () => {
        it('should fetch request data and set it to form', () => {
            const mockData = {
                title: 'Test Request',
                objective: 'Test Objective',
                requestType: 'Single',
                competencies: [{ area: 'Area1', theme: 'Theme1', sub_theme: 'SubTheme1' }]
            }
            homeServiceMock.getRequestDataById.mockReturnValue(of(mockData))
            component.demandId = '123'
            const setRequestDataSpy = jest.spyOn(component, 'setRequestData').mockImplementation(() => { })

            component.getRequestDataById()

            expect(homeServiceMock.getRequestDataById).toHaveBeenCalledWith('123')
            expect(component.requestObjData).toEqual(mockData)
            expect(setRequestDataSpy).toHaveBeenCalled()
        })
    })

    describe('view', () => {
        it('should open dialog with competency item', () => {
            const mockItem = { competencyArea: 'Area1' }

            component.view(mockItem)

            expect(dialogMock.open).toHaveBeenCalled()
            const dialogConfig = dialogMock.open.mock.calls[0][1]
            expect(dialogConfig.data).toBe(mockItem)
            expect(dialogConfig.width).toBe('30%')
        })

        it('should handle DELETE action after dialog close', () => {
            const mockItem = { competencyArea: 'Area1' }
            const removeCompetencySpy = jest.spyOn(component, 'removeCompetency').mockImplementation(() => { })
            dialogMock.open.mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of({ action: 'DELETE', id: 'comp1' }))
            })

            component.view(mockItem)

            expect(removeCompetencySpy).toHaveBeenCalledWith('comp1')
        })
    })
})