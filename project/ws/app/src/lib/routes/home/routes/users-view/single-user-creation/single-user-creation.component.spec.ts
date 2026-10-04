import { of, throwError } from 'rxjs'
import { SingleUserCreationComponent } from './single-user-creation.component'
import { UntypedFormBuilder } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { UsersService } from '../../../../users/services/users.service'
import { RolesService } from '../../../../users/services/roles.service'
import { ActivatedRoute } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'

describe('SingleUserCreationComponent', () => {
    let component: SingleUserCreationComponent
    let formBuilderMock: jest.Mocked<UntypedFormBuilder>
    let usersServiceMock: jest.Mocked<UsersService>
    let matSnackBarMock: jest.Mocked<MatSnackBar>
    let rolesServiceMock: jest.Mocked<RolesService>
    let activatedRouteMock: jest.Mocked<ActivatedRoute>

    beforeEach(() => {
        // Create mocks for all dependencies
        // A real FormBuilder rather than a hand-rolled fake: the component builds its form
        // from it and then uses the full FormGroup/FormControl surface - valueChanges,
        // updateValueAndValidity, setValidators - which a stub has to keep chasing.
        formBuilderMock = new UntypedFormBuilder() as jest.Mocked<UntypedFormBuilder>

        // Everything the component reaches for on this service. They are all subscribed
        // to, so each has to emit; individual tests override the ones they assert on.
        usersServiceMock = {
            getMasterLanguages: jest.fn().mockReturnValue(of({ languages: [] })),
            getGroups: jest.fn().mockReturnValue(of([])),
            createUser: jest.fn().mockReturnValue(of({ result: {} })),
            updateUserDetails: jest.fn().mockReturnValue(of({ result: {} })),
            addUserToRole: jest.fn().mockReturnValue(of({ result: {} })),
            searchDesignation: jest.fn().mockReturnValue(of({ result: { data: [] } })),
            searchIgotDesignation: jest.fn().mockReturnValue(of({ result: { data: [] } })),
        } as unknown as jest.Mocked<UsersService>

        matSnackBarMock = {
            open: jest.fn()
        } as unknown as jest.Mocked<MatSnackBar>

        rolesServiceMock = {
            getAllRoles: jest.fn().mockReturnValue(of({ result: { response: { value: '{}' } } }))
        } as unknown as jest.Mocked<RolesService>

        activatedRouteMock = {
            snapshot: {
                data: {
                    configService: {
                        unMappedUser: {
                            channel: 'web'
                        }
                    }
                }
            }
        } as unknown as jest.Mocked<ActivatedRoute>

        // Create component instance with mocked dependencies
        component = new SingleUserCreationComponent(
            formBuilderMock,
            usersServiceMock,
            matSnackBarMock,
            rolesServiceMock,
            activatedRouteMock,
            // MatDialog, added since this spec was written.
            { open: jest.fn() } as any
        )

        // Mock the QueryList for checkboxes
        component.checkboxes = {
            forEach: jest.fn()
        } as any

        // Setup successful responses for service calls. getDesignation goes through
        // searchDesignation now, and maps result.result.data's `designation` field.
        usersServiceMock.searchDesignation.mockReturnValue(of({
            result: {
                result: {
                    data: [
                        { designation: 'Developer', status: 'Active' },
                        { designation: 'Manager', status: 'Active' }
                    ],
                    totalcount: 2
                }
            }
        }))

        usersServiceMock.getMasterLanguages.mockReturnValue(of({
            languages: [
                { name: 'English' },
                { name: 'Hindi' }
            ]
        }))

        usersServiceMock.getGroups.mockReturnValue(of({
            result: {
                response: ['Group1', 'Group2', 'Others']
            }
        }))

        rolesServiceMock.getAllRoles.mockReturnValue(of({
            result: {
                response: {
                    value: JSON.stringify({
                        orgTypeList: [
                            {
                                name: 'MDO',
                                roles: ['ADMIN', 'CONTENT_CREATOR']
                            }
                        ]
                    })
                }
            }
        }))

        usersServiceMock.createUser.mockReturnValue(of({ success: true }))
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Initialization', () => {
        it('should initialize component and fetch required data', () => {
            // Spy on component methods
            jest.spyOn(component, 'getDesignation')
            jest.spyOn(component, 'getMasterLanguages')
            jest.spyOn(component, 'getGroups')
            jest.spyOn(component, 'getOrgRolesList')
            jest.spyOn(component, 'setDefaultValue')

            // Call lifecycle hooks
            component.ngOnInit()
            component.ngAfterViewInit()

            // Verify methods were called
            expect(component.getDesignation).toHaveBeenCalled()
            expect(component.getMasterLanguages).toHaveBeenCalled()
            expect(component.getGroups).toHaveBeenCalled()
            expect(component.getOrgRolesList).toHaveBeenCalled()
            expect(component.setDefaultValue).toHaveBeenCalled()
        })

        it('should set default values', () => {
            // Spy on the real form rather than swapping in a stand-in: the component's own
            // field initialiser needs a working FormGroup either way.
            const rolesPatchValueMock = jest.spyOn(component.userCreationForm.get('roles')!, 'patchValue')
            const formPatchValueMock = jest.spyOn(component.userCreationForm, 'patchValue')

            // Call the method
            component.setDefaultValue()

            // Verify the default role is set and channel is patched
            expect(rolesPatchValueMock).toHaveBeenCalledWith(['PUBLIC'])
            expect(formPatchValueMock).toHaveBeenCalledWith({
                channel: 'web'
            })
        })
    })

    describe('Data Fetching', () => {
        it('should fetch designations and update masterData', () => {
            component.getDesignation()

            expect(usersServiceMock.searchDesignation).toHaveBeenCalled()
            expect(component.masterData.designationBackup).toEqual([
                { name: 'Developer', status: 'Active' },
                { name: 'Manager', status: 'Active' }
            ])
        })

        it('should handle designation fetch error', () => {
            usersServiceMock.searchDesignation.mockReturnValue(
                throwError(new HttpErrorResponse({ status: 500, statusText: 'Error' }))
            )

            component.getDesignation()

            expect(matSnackBarMock.open).toHaveBeenCalledWith(
                'Unable to fetch designation details, please try again later!'
            )
        })

        it('should fetch master languages and update masterData', () => {
            component.getMasterLanguages()

            expect(usersServiceMock.getMasterLanguages).toHaveBeenCalled()
            expect(component.masterData.language).toEqual([
                { name: 'English' },
                { name: 'Hindi' }
            ])
            expect(component.masterData.languageBackup).toEqual([
                { name: 'English' },
                { name: 'Hindi' }
            ])
        })

        it('should handle master languages fetch error', () => {
            usersServiceMock.getMasterLanguages.mockReturnValue(
                throwError(new HttpErrorResponse({ status: 500, statusText: 'Error' }))
            )

            component.getMasterLanguages()

            expect(matSnackBarMock.open).toHaveBeenCalledWith(
                'Unable to fetch master language details, please try again later!'
            )
        })

        it('should fetch groups and update masterData', () => {
            component.getGroups()

            expect(usersServiceMock.getGroups).toHaveBeenCalled()
            expect(component.masterData.group).toEqual(['Group1', 'Group2'])
        })

        it('should handle groups fetch error', () => {
            usersServiceMock.getGroups.mockReturnValue(
                throwError(new HttpErrorResponse({ status: 500, statusText: 'Error' }))
            )

            component.getGroups()

            expect(matSnackBarMock.open).toHaveBeenCalledWith(
                'Unable to fetch group data, please try again later!'
            )
        })

        it('should fetch roles list and update masterData', () => {
            component.getOrgRolesList()

            expect(rolesServiceMock.getAllRoles).toHaveBeenCalled()
            expect(component.masterData.rolesList).toEqual({
                orgTypeList: [
                    {
                        name: 'MDO',
                        roles: ['ADMIN', 'CONTENT_CREATOR']
                    }
                ]
            })
            expect(component.masterData.mdoRoles).toEqual(['ADMIN', 'CONTENT_CREATOR'])
        })

        it('should handle roles list fetch error', () => {
            rolesServiceMock.getAllRoles.mockReturnValue(
                throwError(new HttpErrorResponse({ status: 500, statusText: 'Error' }))
            )

            component.getOrgRolesList()

            expect(matSnackBarMock.open).toHaveBeenCalledWith(
                'Unable to fetch roles list, please try again later!'
            )
        })
    })

    describe('Form Interactions', () => {
        it('should handle roles checkbox selection', () => {
            // Mock form get and patchValue
            const rolesPatchValue = jest.fn()
            jest.spyOn(component.userCreationForm, 'get').mockReturnValue({
                patchValue: rolesPatchValue
            } as any)

            // Initial state
            component.rolesArr = []
            component.defaultRole = ['PUBLIC']

            // Add a role
            component.handleRolesCheck({ checked: true } as any, 'CONTENT_CREATOR')

            expect(component.rolesArr).toContain('CONTENT_CREATOR')
            expect(rolesPatchValue).toHaveBeenCalledWith(['PUBLIC', 'CONTENT_CREATOR'])

            // Remove the role
            component.handleRolesCheck({ checked: false } as any, 'CONTENT_CREATOR')

            expect(component.rolesArr).not.toContain('CONTENT_CREATOR')
            expect(rolesPatchValue).toHaveBeenCalledWith(['PUBLIC'])
        })

        it('should handle adding tags', () => {
            // Mock form get and value
            const tagsMock = {
                value: [],
                patchValue: jest.fn(),
                // handleAddTags finishes by revalidating the control.
                updateValueAndValidity: jest.fn()
            }
            jest.spyOn(component.userCreationForm, 'get').mockReturnValue(tagsMock as any)

            // Add a tag
            component.handleAddTags({
                value: 'newTag',
                input: { value: 'newTag' }
            } as any)

            expect(tagsMock.value).toContain('newTag')
            expect(tagsMock.value.length).toBe(1)
        })

        it('should handle removing tags', () => {
            // Mock form get and value
            const tagsMock = {
                value: ['tag1', 'tag2', 'tag3']
            }
            jest.spyOn(component.userCreationForm, 'get').mockReturnValue(tagsMock as any)

            // Remove a tag
            component.handleRemoveTag('tag2')

            expect(tagsMock.value).not.toContain('tag2')
            expect(tagsMock.value.length).toBe(2)
        })

        it('should clear the form', () => {
            // Setup mocks
            const formResetMock = jest.fn()
            const checkboxesForEachMock = jest.fn()

            jest.spyOn(component.userCreationForm, 'reset').mockImplementation(formResetMock)
            jest.spyOn(component.checkboxes, 'forEach').mockImplementation(checkboxesForEachMock)
            jest.spyOn(component, 'setDefaultValue').mockImplementation(() => { })

            // Call method
            component.handleFormClear()

            // Verify
            expect(formResetMock).toHaveBeenCalled()
            expect(checkboxesForEachMock).toHaveBeenCalled()
            expect(component.rolesArr).toEqual([])
            expect(component.setDefaultValue).toHaveBeenCalled()
        })
    })

    describe('User Creation', () => {
        it('should successfully create a user', () => {
            // Mock Date constructor
            const originalDate = global.Date
            const mockDate: any = jest.fn(() => ({
                getDate: () => 1,
                getMonth: () => 0, // January (0-based)
                getFullYear: () => 2025
            }))
            mockDate.now = originalDate.now
            global.Date = mockDate as any

            // Setup form values with dob
            component.userCreationForm.patchValue({
                email: 'test@example.com',
                firstName: 'Test',
                phone: '9876543210',
                channel: 'web',
                designation: 'Developer',
                group: 'Group1',
                roles: ['PUBLIC', 'CONTENT_CREATOR'],
                dob: new Date() // will use our mock
            })

            // Call method
            component.handleUserCreation()

            // Verify. createUser's mock emits synchronously, so displayLoader is already
            // back down by the time handleUserCreation returns - it is asserted below.
            // Account-level fields stay at the top under personalDetails; the profile
            // fields, dob among them, are nested under profileDetails.personalDetails.
            expect(usersServiceMock.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    personalDetails: expect.objectContaining({
                        email: 'test@example.com',
                        channel: 'web',
                    }),
                    profileDetails: expect.objectContaining({
                        personalDetails: expect.objectContaining({
                            dob: '1-1-2025', // Formatted date
                        }),
                    }),
                })
            )

            // Verify success handling
            expect(component.displayLoader).toBe(false)
            expect(matSnackBarMock.open).toHaveBeenCalledWith('User created successfully!')

            // Restore original Date
            global.Date = originalDate
        })

        it('should show error when channel is empty', () => {
            // Setup form value without channel
            component.userCreationForm.patchValue({
                email: 'test@example.com',
                firstName: 'Test',
                phone: '9876543210',
                channel: '', // Empty channel
                designation: 'Developer',
                group: 'Group1',
                roles: ['PUBLIC', 'CONTENT_CREATOR']
            })

            // Call method
            component.handleUserCreation()

            // Verify
            expect(matSnackBarMock.open).toHaveBeenCalledWith('Channel info is empty! So unable to create user')
            expect(usersServiceMock.createUser).not.toHaveBeenCalled()
        })

        it('should handle user creation error', () => {
            // Setup form values with channel
            component.userCreationForm.patchValue({
                email: 'test@example.com',
                firstName: 'Test',
                phone: '9876543210',
                channel: 'web',
                designation: 'Developer',
                group: 'Group1',
                roles: ['PUBLIC', 'CONTENT_CREATOR']
            })

            // Setup error response
            const errorResponse = new HttpErrorResponse({
                error: {
                    params: {
                        errmsg: 'Email already exists'
                    }
                },
                status: 400,
                statusText: 'Bad Request'
            })

            usersServiceMock.createUser.mockReturnValue(throwError(errorResponse))

            // Call method
            component.handleUserCreation()

            // Verify
            expect(component.displayLoader).toBe(false)
            expect(matSnackBarMock.open).toHaveBeenCalledWith('Email already exists')
        })
    })

    describe('Lifecycle Hooks', () => {
        it('should unsubscribe on destroy', () => {
            const unsubscribeSpy = jest.spyOn(component['destroySubject$'], 'unsubscribe')

            component.ngOnDestroy()

            expect(unsubscribeSpy).toHaveBeenCalled()
        })
    })
})