
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms'
import { of } from 'rxjs'
import { ActivityLabelsComponent } from './activity-labels.component'
import { WatStoreService } from '../../services/wat.store.service'
import { AllocationService } from '../../../workallocation/services/allocation.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ChangeDetectorRef } from '@angular/core'
import { CdkDragDrop } from '@angular/cdk/drag-drop'
import { NSWatActivity } from '../../models/activity-wot.model'
import { WatRolePopupComponent } from './wat-role-popup/wat-role-popup.component'
import { DialogConfirmComponent } from '../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'

// Mock dependencies
jest.mock('@angular/cdk/drag-drop', () => ({
    CdkDragDrop: jest.fn(),
    moveItemInArray: jest.fn(),
    transferArrayItem: jest.fn(),
}))

describe('ActivityLabelsComponent', () => {
    let component: ActivityLabelsComponent
    let formBuilder: UntypedFormBuilder
    let allocateService: jest.Mocked<AllocationService>
    let watStore: jest.Mocked<WatStoreService>
    let snackBar: jest.Mocked<MatSnackBar>
    let dialog: jest.Mocked<MatDialog>
    let changeDetector: jest.Mocked<ChangeDetectorRef>

    beforeEach(() => {
        // Create mocks for all dependencies
        formBuilder = new UntypedFormBuilder()

        allocateService = {
            onSearchUser: jest.fn(),
            onSearchActivity: jest.fn(),
            onSearchRole: jest.fn(),
        } as unknown as jest.Mocked<AllocationService>

        watStore = {
            setgetactivitiesGroup: jest.fn(),
            getID: 'mock-id-123',
            getcompetencyGroupValue: [],
            getOfficerId: 'officer-123'
        } as unknown as jest.Mocked<WatStoreService>

        snackBar = {
            open: jest.fn()
        } as unknown as jest.Mocked<MatSnackBar>

        dialog = {
            open: jest.fn()
        } as unknown as jest.Mocked<MatDialog>

        changeDetector = {
            detectChanges: jest.fn()
        } as unknown as jest.Mocked<ChangeDetectorRef>

        // Create component
        component = new ActivityLabelsComponent(
            changeDetector,
            formBuilder,
            allocateService,
            watStore,
            snackBar,
            dialog
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize the component and create forms', () => {
            const createFormSpy = jest.spyOn(component, 'createForm')
            const initListenSpy = jest.spyOn(component, 'initListen')

            component.ngOnInit()

            expect(component.activityForm).toBeDefined()
            expect(createFormSpy).toHaveBeenCalled()
            expect(initListenSpy).toHaveBeenCalled()
        })
    })

    describe('createForm', () => {
        it('should create form with no edit data', () => {
            const addNewGroupSpy = jest.spyOn(component, 'addNewGroup')

            component.createForm()

            expect(component.activityForm).toBeDefined()
            // With no edit data createForm calls addNewGroup() with no arguments; the
            // explicit true is only passed on the edit path with no unmapped activities.
            expect(addNewGroupSpy).toHaveBeenCalledWith()
        })

        it('should create form with edit data', () => {
            const addNewGroupSpy = jest.spyOn(component, 'addNewGroup')
            const addNewGroupActivityCustomSpy = jest.spyOn(component, 'addNewGroupActivityCustom')

            component.editData = {
                unmdA: [
                    { localId: 'test-id', activityDescription: 'Test Activity' }
                ],
                list: []
            }

            component.createForm()

            expect(component.activityForm).toBeDefined()
            expect(addNewGroupSpy).toHaveBeenCalledWith(false)
            expect(addNewGroupActivityCustomSpy).toHaveBeenCalled()
        })

        it('should create form with edit data including roles', () => {
            const addNewGroupSpy = jest.spyOn(component, 'addNewGroup')
            const addNewGroupActivityCustomSpy = jest.spyOn(component, 'addNewGroupActivityCustom')

            component.editData = {
                list: [
                    {
                        roleDetails: {
                            id: 'role-1',
                            name: 'Test Role',
                            description: 'Test Role Description',
                            childNodes: [
                                {
                                    id: 'activity-1',
                                    name: 'Test Activity',
                                    description: 'Test Activity Description',
                                    submittedToName: 'Test User',
                                    submittedToId: 'user-1',
                                    submittedToEmail: 'test@example.com'
                                }
                            ]
                        }
                    }
                ]
            }

            component.createForm()

            expect(component.activityForm).toBeDefined()
            expect(addNewGroupSpy).toHaveBeenCalledWith(false, expect.any(Object))
            expect(addNewGroupActivityCustomSpy).toHaveBeenCalled()
        })
    })

    describe('addNewGroup', () => {
        beforeEach(() => {
            component.ngOnInit()
        })

        it('should add new group with default activity', () => {
            const oldLength = component.groupList.length

            component.addNewGroup(true)

            expect(component.groupList.length).toBe(oldLength + 1)
            const newGroup = component.groupList.at(component.groupList.length - 1) as UntypedFormGroup
            const activities = newGroup.get('activities') as UntypedFormArray
            expect(activities.length).toBe(1)
        })

        it('should add new group without default activity', () => {
            const oldLength = component.groupList.length

            component.addNewGroup(false)

            expect(component.groupList.length).toBe(oldLength + 1)
            const newGroup = component.groupList.at(component.groupList.length - 1) as UntypedFormGroup
            const activities = newGroup.get('activities') as UntypedFormArray
            expect(activities.length).toBe(0)
        })

        it('should add new group with provided group data', () => {
            const groupData = {
                localId: 'custom-id',
                groupId: 'test-group',
                groupName: 'Test Group',
                groupDescription: 'Test Description'
            } as NSWatActivity.IActivityGroup

            component.addNewGroup(false, groupData)

            const newGroup = component.groupList.at(component.groupList.length - 1) as UntypedFormGroup
            expect(newGroup.get('groupId')?.value).toBe('test-group')
            expect(newGroup.get('groupName')?.value).toBe('Test Group')
            expect(newGroup.get('groupDescription')?.value).toBe('Test Description')
        })
    })

    describe('addNewGroupActivity', () => {
        beforeEach(() => {
            component.ngOnInit()
            component.addNewGroup(true)
        })

        it('should add a new activity to the specified group', () => {
            const groupIndex = 0
            const initialActivityCount = component.groupActivityList.length

            component.activeGroupIdx = groupIndex
            component.addNewGroupActivity(groupIndex)

            expect(component.groupActivityList.length).toBe(initialActivityCount + 1)
        })
    })

    describe('dropgroup', () => {
        beforeEach(() => {
            component.ngOnInit()
            component.addNewGroup(true)
            component.addNewGroup(true)
        })

        it('should move item within the same container', () => {
            const mockEvent = {
                previousContainer: { id: 'groups_0', data: [] },
                container: { id: 'groups_0', data: [] },
                previousIndex: 0,
                currentIndex: 1,
                item: { data: { activityDescription: 'Test' } }
            } as unknown as CdkDragDrop<NSWatActivity.IActivity[]>

            //const moveItemSpy = jest.spyOn(component.groupActivityList, 'moveItemInArray')

            component.dropgroup(mockEvent)

            expect(watStore.setgetactivitiesGroup).toHaveBeenCalled()
        })

        it('should not transfer empty activity to another container', () => {
            const mockEvent = {
                previousContainer: { id: 'groups_0', data: [] },
                container: { id: 'groups_1', data: [] },
                previousIndex: 0,
                currentIndex: 0,
                item: { data: {} }
            } as unknown as CdkDragDrop<NSWatActivity.IActivity[]>

            component.dropgroup(mockEvent)

            expect(snackBar.open).toHaveBeenCalledWith('Empty activity!! You can not drag', undefined, { duration: 2000 })
        })
    })

    describe('evenPredicate', () => {
        it('should return true for valid activity', () => {
            const result = component.evenPredicate({ data: { activityDescription: 'Test' } } as any)
            expect(result).toBe(true)
        })

        it('should return false for empty activity', () => {
            const result = component.evenPredicate({ data: null } as any)
            expect(result).toBe(false)
        })
    })

    describe('filterUsers', () => {
        it('should call search service and update users list', async () => {
            allocateService.onSearchUser.mockReturnValue(of({
                result: {
                    response: {
                        content: [
                            { userId: 'user-1', firstName: 'Test User' }
                        ]
                    }
                }
            }))

            await component.filterUsers('test')

            expect(allocateService.onSearchUser).toHaveBeenCalledWith('test')
            expect(component.userslist).toEqual([
                { userId: 'user-1', firstName: 'Test User' }
            ])
        })
    })

    describe('deleteGrp', () => {
        beforeEach(() => {
            component.ngOnInit()
            component.addNewGroup(true)
        })

        it('should show error if officer id is not available', () => {
            Object.defineProperty(watStore, 'getOfficerId', {
                get: jest.fn().mockReturnValue(null)
            })

            component.deleteGrp(0)

            expect(snackBar.open).toHaveBeenCalledWith(
                'Please save work order and open in edit mode !! ',
                undefined,
                { duration: 2000 }
            )
        })

        it('should open confirmation dialog when deleting a group', () => {
            dialog.open.mockReturnValue({
                afterClosed: () => of(true)
            } as any)

            component.deleteGrp(0)

            expect(dialog.open).toHaveBeenCalledWith(DialogConfirmComponent, expect.any(Object))
        })

        it('should remove group when dialog is confirmed', () => {
            dialog.open.mockReturnValue({
                afterClosed: () => of(true)
            } as any)

            //const initialGroupCount = component.groupList.length
            const removeAtSpy = jest.spyOn(component.groupList, 'removeAt')

            component.deleteGrp(0)

            expect(removeAtSpy).toHaveBeenCalledWith(0)
            expect(watStore.setgetactivitiesGroup).toHaveBeenCalled()
            expect(snackBar.open).toHaveBeenCalledWith(
                'Role removed successfully, Please sit back, Page will reload.!! ',
                undefined,
                { duration: 2000 }
            )
        })
    })

    describe('roleSelected', () => {
        beforeEach(() => {
            component.ngOnInit()
            component.addNewGroup(true)
        })

        it('should open role popup dialog and update group on confirmation', () => {
            const roleData = {
                name: 'Test Role',
                description: 'Test Role Description',
                id: 'role-123'
            }

            dialog.open.mockReturnValue({
                afterClosed: () => of({
                    ok: true,
                    data: [
                        { activityDescription: 'New Activity' }
                    ]
                })
            } as any)

            const event = {
                option: {
                    value: roleData
                }
            }

            component.roleSelected(event, 0)

            expect(dialog.open).toHaveBeenCalledWith(WatRolePopupComponent, expect.any(Object))

            // Check that role info was updated
            const group = component.groupList.at(0) as UntypedFormGroup
            expect(group.get('groupName')?.value).toBe('Test Role')
            expect(group.get('groupDescription')?.value).toBe('Test Role Description')
            expect(group.get('groupId')?.value).toBe('role-123')

            // Should have called store update
            expect(watStore.setgetactivitiesGroup).toHaveBeenCalled()
        })
    })

    describe('userClicked', () => {
        beforeEach(() => {
            component.ngOnInit()
            component.addNewGroup(true)
            component.selectedActivityIdx = 0
        })

        it('should update assignedTo fields when user is selected', () => {
            const userData = {
                userId: 'user-123',
                firstName: 'Test',
                profileDetails: {
                    personalDetails: {
                        primaryEmail: 'test@example.com'
                    }
                }
            }

            const event = {
                option: {
                    value: userData
                }
            }

            component.userClicked(event, 0, 'to')

            // Check that user data was set in the correct activity
            const group = component.groupList.at(0) as UntypedFormGroup
            const activities = group.get('activities') as UntypedFormArray
            const activity = activities.at(0)

            expect(activity.get('assignedTo')?.value).toBe('Test')
            expect(activity.get('assignedToId')?.value).toBe('user-123')
            expect(activity.get('assignedToEmail')?.value).toBe('test@example.com')

            expect(watStore.setgetactivitiesGroup).toHaveBeenCalled()
        })

        it('should handle Final authority selection', () => {
            const event = {
                option: {
                    value: 'Final authority'
                }
            }

            component.userClicked(event, 0, 'to')

            // Check that Final authority data was set
            const group = component.groupList.at(0) as UntypedFormGroup
            const activities = group.get('activities') as UntypedFormArray
            const activity = activities.at(0)

            expect(activity.get('assignedTo')?.value).toBe('Final authority')
            expect(activity.get('assignedToId')?.value).toBe('')
            expect(activity.get('assignedToEmail')?.value).toBe('')
        })
    })

    describe('deleteSingleActivity', () => {
        beforeEach(() => {
            component.ngOnInit()
            component.addNewGroup(true)
            component.addNewGroupActivity(0)
        })

        it('should open confirmation dialog when deleting an activity', () => {
            dialog.open.mockReturnValue({
                afterClosed: () => of(true)
            } as any)

            const deleteRowSpy = jest.spyOn(component, 'deleteRowActivity')

            component.deleteSingleActivity(0, 1)

            expect(dialog.open).toHaveBeenCalledWith(DialogConfirmComponent, expect.any(Object))
            expect(deleteRowSpy).toHaveBeenCalledWith(0, 1)
            expect(snackBar.open).toHaveBeenCalledWith('Activity deleted successfully!! ', undefined, { duration: 2000 })
        })

        it('should not delete if dialog is cancelled', () => {
            dialog.open.mockReturnValue({
                afterClosed: () => of(false)
            } as any)

            const deleteRowSpy = jest.spyOn(component, 'deleteRowActivity')

            component.deleteSingleActivity(0, 1)

            expect(deleteRowSpy).not.toHaveBeenCalled()
        })
    })
})