import { CreateContentComponent } from './create-content.component'
import { TrainingPlanDataSharingService } from './../../services/training-plan-data-share.service'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { ConfirmationBoxComponent } from '../../components/confirmation-box/confirmation.box.component'

// Mock dependencies
jest.mock('../../services/training-plan-data-share.service')
jest.mock('@angular/router')
jest.mock('@angular/material/dialog')

describe('CreateContentComponent', () => {
    let component: CreateContentComponent
    let tpdsSvcMock: jest.Mocked<TrainingPlanDataSharingService>
    let dialogMock: jest.Mocked<MatDialog>
    let routerMock: jest.Mocked<Router>

    beforeEach(() => {
        tpdsSvcMock = new TrainingPlanDataSharingService() as jest.Mocked<TrainingPlanDataSharingService>
        dialogMock = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatDialog>
        routerMock = new Router() as jest.Mocked<Router>
        // The component reads the plan content list through the service, the automock is wired to
        // the contentList each test sets up
        tpdsSvcMock.getContentList = jest.fn(() =>
            tpdsSvcMock.trainingPlanStepperData?.contentList || [])
        tpdsSvcMock.isContentSelected = jest.fn((identifier: string) =>
            (tpdsSvcMock.trainingPlanStepperData?.contentList || [])
                .some((item: any) => (typeof item === 'string' ? item : item?.identifier) === identifier))
        // The chips are the plan's content in plan order, so this mirrors the real method:
        // the ids on the plan, resolved against the content the service is holding.
        tpdsSvcMock.getSelectedContentInPlanOrder = jest.fn(() => {
            const byId = new Map<string, any>()
            ;(tpdsSvcMock.trainingPlanContentData?.data?.content || [])
                .forEach((item: any) => byId.set(item.identifier, item))
            return (tpdsSvcMock.trainingPlanStepperData?.contentList || [])
                .map((item: any) => byId.get(typeof item === 'string' ? item : item?.identifier))
                .filter((item: any) => !!item)
        })
        component = new CreateContentComponent(tpdsSvcMock, dialogMock, routerMock)
    })

    // Test case 1: Component initialization
    it('should initialize category data and isAparEnabled correctly when isApar is truthy', () => {
        tpdsSvcMock.trainingPlanStepperData = { isApar: true }
        component = new CreateContentComponent(tpdsSvcMock, dialogMock, routerMock)
        component.ngOnInit()
        expect(component.categoryData.length).toBe(5)
        expect(component.categoryData[0].name).toBe('Courses')
        expect(component.isAparEnabled).toBe(true)
        expect(tpdsSvcMock.trainingPlanStepperData.isApar).toBe(true)
    })

    it('should initialize category data and set isApar on service when isApar is falsy', () => {
        tpdsSvcMock.trainingPlanStepperData = { isApar: undefined }
        component = new CreateContentComponent(tpdsSvcMock, dialogMock, routerMock)
        component.isAparEnabled = false
        component.ngOnInit()
        expect(component.categoryData.length).toBe(5)
        expect(component.categoryData[0].name).toBe('Courses')
        expect(tpdsSvcMock.trainingPlanStepperData.isApar).toBe(false)
    })

    // Test case 2: handleApiData when trainingPlanContentData and content exist
    it('should update contentData and count in handleApiData when trainingPlanContentData and content exist', () => {
        tpdsSvcMock.trainingPlanContentData = {
            data: {
                content: [{ identifier: '1', selected: false }, { identifier: '2', selected: true }],
                count: 2
            }
        }
        tpdsSvcMock.trainingPlanStepperData = {
            contentList: ['2']
        }
        component.handleApiData(true)
        expect(component.contentData.length).toBe(2)
        expect(component.count).toBe(2)
    })

    // Test case 3: handleSelectedChips when there are selected items
    it('should update selectedContentChips and selectContentCount in handleSelectedChips', () => {
        tpdsSvcMock.trainingPlanContentData = {
            data: {
                content: [{ identifier: '1', selected: false }, { identifier: '2', selected: true }]
            }
        }
        // Both the chips and the count come from the plan's content list, not from the page
        // being shown, so one selected id means one chip and a count of one.
        tpdsSvcMock.trainingPlanStepperData = { contentList: ['2'] }
        component.handleSelectedChips(true)
        expect(component.selectedContentChips.length).toBe(1)
        expect(component.selectedContentChips[0].identifier).toBe('2')
        expect(component.selectContentCount).toBe(1)
    })

    // Test case 4: handleSelectedChips when there are no selected items
    it('should emit true in addContentInvalid when no items are selected in handleSelectedChips', () => {
        tpdsSvcMock.trainingPlanContentData = {
            data: {
                content: [{ identifier: '1', selected: false }, { identifier: '2', selected: false }]
            }
        }
        const spy = jest.spyOn(component.addContentInvalid, 'emit')
        component.handleSelectedChips(true)
        expect(spy).toHaveBeenCalledWith(true)
    })

    // Test case 5: itemsRemovedFromChip should call handleSelectedChips
    it('should call handleSelectedChips when items are removed from chip', () => {
        // Provide mock data to avoid undefined error
        tpdsSvcMock.trainingPlanContentData = {
            data: {
                content: [{ identifier: '1', selected: false }, { identifier: '2', selected: true }]
            }
        } as any
        // itemsRemovedFromChip also reads trainingPlanStepperData.status straight off the
        // service, so it has to exist.
        tpdsSvcMock.trainingPlanStepperData = { contentList: ['2'], status: 'Draft' }
        const spy = jest.spyOn(component, 'handleSelectedChips')
        component.itemsRemovedFromChip()
        expect(spy).toHaveBeenCalledWith(true)
    })

    // Test case 6: showAddContentDialog should open dialog and navigate
    it('should open dialog and navigate on confirmation', () => {
        const afterClosedMock = { subscribe: (cb: any) => cb('confirmed') }
        const dialogRefMock = { afterClosed: jest.fn(() => afterClosedMock) }
        // @ts-ignore
        dialogMock.open.mockImplementation(() => dialogRefMock)
        const navigateSpy = jest.spyOn(routerMock, 'navigate')

        component.showAddContentDialog()

        expect(dialogMock.open).toHaveBeenCalledWith(ConfirmationBoxComponent, expect.any(Object))
        expect(navigateSpy).toHaveBeenCalledWith(['/app/home/create-request-form'])
    })

    // Test case 7: showAddContentDialog should not navigate if not confirmed
    it('should not navigate if dialog is not confirmed', () => {
        const afterClosedMock = { subscribe: (cb: any) => cb('cancelled') }
        const dialogRefMock = { afterClosed: jest.fn(() => afterClosedMock) }
        // @ts-ignore
        dialogMock.open.mockImplementation(() => dialogRefMock)
        const navigateSpy = jest.spyOn(routerMock, 'navigate')

        component.showAddContentDialog()

        expect(dialogMock.open).toHaveBeenCalledWith(ConfirmationBoxComponent, expect.any(Object))
        expect(navigateSpy).not.toHaveBeenCalled()
    })

    // Test case 8: the APAR toggle, which is also what shows and hides the gating courses
    it('should raise the APAR flag when the toggle is switched on', () => {
        tpdsSvcMock.trainingPlanStepperData = { isApar: false }

        component.onAparCheckboxChange({ target: { checked: true } } as any)

        expect(component.isAparEnabled).toBe(true)
        expect(tpdsSvcMock.trainingPlanStepperData.isApar).toBe(true)
    })

    it('should drop the APAR flag when the toggle is switched off', () => {
        tpdsSvcMock.trainingPlanStepperData = { isApar: true }
        component.isAparEnabled = true

        component.onAparCheckboxChange({ target: { checked: false } } as any)

        expect(component.isAparEnabled).toBe(false)
        expect(tpdsSvcMock.trainingPlanStepperData.isApar).toBe(false)
    })

    // Test case 9: the gating courses go with the toggle, and so do the flags they set
    it('should clear the mandatory content when APAR is switched off', () => {
        tpdsSvcMock.trainingPlanStepperData = { isApar: true }

        component.onAparCheckboxChange({ target: { checked: false } } as any)

        expect(tpdsSvcMock.clearMandatoryContent).toHaveBeenCalled()
    })

    it('should leave the mandatory content alone when APAR is switched on', () => {
        tpdsSvcMock.trainingPlanStepperData = { isApar: false }

        component.onAparCheckboxChange({ target: { checked: true } } as any)

        expect(tpdsSvcMock.clearMandatoryContent).not.toHaveBeenCalled()
    })

    it('should mark a Live plan as changed when APAR is switched off', () => {
        tpdsSvcMock.trainingPlanStepperData = { isApar: true, status: 'Live' }
        tpdsSvcMock.isContentChanged = false

        component.onAparCheckboxChange({ target: { checked: false } } as any)

        expect(tpdsSvcMock.isContentChanged).toBe(true)
    })

    it('should not mark a draft plan as changed when APAR is switched off', () => {
        tpdsSvcMock.trainingPlanStepperData = { isApar: true, status: 'Draft' }
        tpdsSvcMock.isContentChanged = false

        component.onAparCheckboxChange({ target: { checked: false } } as any)

        expect(tpdsSvcMock.isContentChanged).toBe(false)
    })

    it('should open an APAR plan with the flag already raised', () => {
        tpdsSvcMock.trainingPlanStepperData = { isApar: true }
        component = new CreateContentComponent(tpdsSvcMock, dialogMock, routerMock)

        component.ngOnInit()

        expect(component.isAparEnabled).toBe(true)
        expect(component.aparCheckboxDisabled).toBe(true)
    })

    it('should open a plan that is not APAR with the flag down', () => {
        tpdsSvcMock.trainingPlanStepperData = {}
        component = new CreateContentComponent(tpdsSvcMock, dialogMock, routerMock)

        component.ngOnInit()

        expect(component.isAparEnabled).toBe(false)
    })
})
