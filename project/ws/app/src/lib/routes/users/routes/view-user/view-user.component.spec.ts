import { ViewUserComponent } from './view-user.component'
import { of, Subject } from 'rxjs'
import { NavigationEnd } from '@angular/router'

describe('ViewUserComponent', () => {
    let component: ViewUserComponent
    let mockActivatedRoute: any
    let mockRouter: any
    let mockEventService: any
    let mockUsersService: any
    let mockSnackBar: any
    let mockElementRef: any
    let mockRouterEvents: Subject<any>

    beforeEach(() => {
        // Mock data setup
        const mockProfileData = {
            data: {
                profileDetails: {
                    id: 'user123',
                    personalDetails: {
                        firstname: 'John',
                        surname: 'Doe'
                    },
                    academics: [],
                    professionalDetails: [{
                        designation: 'Developer',
                        tags: ['angular', 'typescript']
                    }],
                    employmentDetails: [],
                    skills: [],
                    interests: [],
                    additionalProperties: {
                        tag: ['angular', 'typescript']
                    }
                },
                isDeleted: false,
                roles: ['PUBLIC', 'CONTENT_CREATOR']
            }
        }

        const mockConfigService = {
            unMappedUser: {
                rootOrgId: 'org123',
                rootOrg: {
                    orgName: 'Test Organization'
                },
                roles: ['MDO_ADMIN']
            }
        }

        const mockRolesList = {
            data: {
                orgTypeList: [
                    {
                        name: 'MDO',
                        roles: ['PUBLIC', 'MDO_DASHBOARD_USER', 'MDO_LEADER']
                    }
                ]
            }
        }

        const mockWorkflowHistoryData = {
            data: {
                result: {
                    data: {
                        history: [{
                            inWorkflow: false,
                            createdOn: new Date().toISOString(),
                            updateFieldValues: JSON.stringify([{
                                fieldKey: 'designation',
                                toValue: { designation: 'Developer' },
                                fromValue: { designation: 'Designer' }
                            }]),
                            action: 'UPDATE',
                            comment: 'Updated designation'
                        }]
                    }
                }
            }
        }

        const mockPageData = {
            data: {
                profileData: [
                    { key: 'designation', name: 'Designation' }
                ],
                profileDataKey: [
                    { key: 'designation', name: 'Designation' }
                ]
            }
        }

        // Mock services and dependencies
        mockRouterEvents = new Subject()

        mockRouter = {
            events: mockRouterEvents,
            navigate: jest.fn()
        }

        mockActivatedRoute = {
            snapshot: {
                data: {
                    configService: mockConfigService,
                    profileData: mockProfileData,
                    workflowHistoryData: mockWorkflowHistoryData,
                    rolesList: mockRolesList
                },
                paramMap: {
                    get: jest.fn()
                }
            },
            data: of({ pageData: mockPageData }),
            queryParamMap: of({
                get: (param: string) => {
                    if (param === 'param') return null
                    if (param === 'path') return null
                    return null
                }
            })
        }

        mockEventService = {
            raiseInteractTelemetry: jest.fn()
        }

        mockUsersService = {
            getDesignations: jest.fn().mockReturnValue(of({
                responseData: ['Developer', 'Designer', 'Manager', 'Other']
            })),
            updateUserDetails: jest.fn().mockReturnValue(of({ success: true })),
            addUserToDepartment: jest.fn().mockReturnValue(of({ success: true })),
            // Subscribed to when the roles form is submitted.
            addUserToRole: jest.fn().mockReturnValue(of({ success: true }))
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockElementRef = {
            nativeElement: {
                parentElement: {
                    offsetTop: 100
                }
            }
        }

        // Create component instance
        component = new ViewUserComponent(
            mockActivatedRoute as any,
            mockRouter as any,
            mockEventService as any,
            mockUsersService as any,
            mockSnackBar as any
        )

        // Set up properties that would normally be set by Angular
        component.menuElement = mockElementRef

        // Manually call ngOnInit
        component.ngOnInit()
    })

    it('should create', () => {
        expect(component).toBeDefined()
    })

    it('should initialize component properties on navigation end', () => {
        // Simulate router navigation end event
        mockRouterEvents.next(new NavigationEnd(1, '/some/url', '/some/url'))

        // Verify component properties are set correctly
        expect(component.fullname).toBe('John')
        expect(component.userStatus).toBe('Active')
        expect(component.tabsData.length).toBe(5)
        expect(component.isMdoAdmin).toBe(true)
    })

    it('should handle scroll events correctly', () => {
        // Set component's element position
        component.elementPosition = 100

        // Simulate window scroll below element position
        Object.defineProperty(window, 'pageYOffset', { value: 50, writable: true })
        component.handleScroll()
        expect(component.sticky).toBe(false)

        // Simulate window scroll above element position
        Object.defineProperty(window, 'pageYOffset', { value: 150, writable: true })
        component.handleScroll()
        expect(component.sticky).toBe(true)
    })

    it('should modify user roles correctly', () => {
        // Test adding a role
        component.userRoles.clear()
        component.modifyUserRoles('CONTENT_CREATOR')
        expect(component.userRoles.has('CONTENT_CREATOR')).toBe(true)

        // Test removing the same role
        component.modifyUserRoles('CONTENT_CREATOR')
        expect(component.userRoles.has('CONTENT_CREATOR')).toBe(false)
    })

    it('should handle side navigation tab clicks', () => {
        // Setup
        const scrollIntoViewMock = jest.fn()
        document.getElementById = jest.fn().mockImplementation(() => ({
            scrollIntoView: scrollIntoViewMock
        }))

        // tabsData is populated during init; onSideNavTabClick iterates it.
        component.tabsData = [{ key: 'personalInfo', name: 'Personal Info' }]

        // Execute
        component.onSideNavTabClick('personalInfo')

        // Assert
        expect(component.currentTab).toBe('personalInfo')
        expect(document.getElementById).toHaveBeenCalledWith('personalInfo')
        expect(scrollIntoViewMock).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'start',
            inline: 'start'
        })
        expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
    })

    it('should reset roles correctly', () => {
        // Setup
        component.orguserRoles = ['PUBLIC', 'CONTENT_CREATOR']

        // Execute
        component.resetRoles()

        // Assert
        expect(component.updateUserRoleForm.controls['roles'].value).toEqual(['PUBLIC', 'CONTENT_CREATOR'])
    })

    it('should update tags correctly', () => {
        // Setup
        const profileData = {
            additionalProperties: {
                tag: ['angular', 'javascript']
            }
        }

        // Execute
        component.updateTags(profileData)

        // Assert
        expect(component.selectedtags).toEqual(['angular', 'javascript'])
    })

    it('should add activity/tag correctly', () => {
        // Setup
        component.selectedtags = ['angular']
        component.updateProfessionalForm.controls['tags'].setValue('react')
        const mockEvent = {
            input: { value: 'react' },
            value: 'react'
        }

        // Execute
        component.addActivity(mockEvent as any)

        // Assert
        expect(component.selectedtags).toContain('react')
        expect(component.isTagsEdited).toBe(true)
    })

    it('should remove activity/tag correctly', () => {
        // Setup
        component.selectedtags = ['angular', 'react', 'vue']

        // Execute
        component.removeActivity('react')

        // Assert
        expect(component.selectedtags).toEqual(['angular', 'vue'])
        expect(component.isTagsEdited).toBe(true)
    })

    it('should submit professional form correctly', () => {
        // Setup
        component.userID = 'user123'
        component.professionalDetails = {
            designation: 'Developer',
            tags: ['angular', 'typescript']
        }
        component.selectedtags = ['angular', 'typescript', 'react']
        component.updateProfessionalForm.controls['designation'].setValue('Senior Developer')

        // Execute
        component.onSubmit(component.updateProfessionalForm, 'Professional')

        // Assert
        expect(mockUsersService.updateUserDetails).toHaveBeenCalledWith(expect.objectContaining({
            request: {
                userId: 'user123',
                profileDetails: {
                    professionalDetails: [
                        { designation: 'Senior Developer' }
                    ],
                    additionalProperties: {
                        tag: ['angular', 'typescript', 'react']
                    }
                }
            }
        }))
        expect(mockSnackBar.open).toHaveBeenCalledWith('User updated Successfully', 'X', { duration: 5000 })
    })

    it('should submit roles form correctly when roles are changed', () => {
        // Setup
        component.userID = 'user123'
        component.department = 'org123'
        component.orguserRoles = ['PUBLIC']
        component.userRoles = new Set(['PUBLIC', 'CONTENT_CREATOR'])

        // Execute
        component.onSubmit(component.updateUserRoleForm, 'Roles')

        // Assert: the roles branch posts to addUserToRole, not addUserToDepartment.
        expect(mockUsersService.addUserToRole).toHaveBeenCalledWith({
            request: {
                organisationId: 'org123',
                userId: 'user123',
                roles: ['PUBLIC', 'CONTENT_CREATOR']
            }
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('User role updated Successfully', 'X', { duration: 5000 })
    })

    it('should show error message when submitting roles form with no changes', () => {
        // Setup. The component detects "unchanged" by reference (form.value.roles !==
        // this.orguserRoles), which is how it behaves in the app: patchUserRoles seeds the
        // control with the orguserRoles array itself, and picking a role replaces it.
        component.orguserRoles = ['PUBLIC', 'CONTENT_CREATOR']
        component.userRoles = new Set(['PUBLIC', 'CONTENT_CREATOR'])
        component.updateUserRoleForm.controls['roles'].setValue(component.orguserRoles)

        // Execute
        component.onSubmit(component.updateUserRoleForm, 'Roles')

        // Assert
        expect(mockUsersService.addUserToRole).not.toHaveBeenCalled()
        expect(mockSnackBar.open).toHaveBeenCalledWith('Select new roles', 'X', { duration: 5000 })
    })

    it('should handle image error by changing to default image', () => {
        // Setup
        const mockEvent = {
            target: { src: 'some-url' }
        }

        // Execute
        component.changeToDefaultImg(mockEvent)

        // Assert
        expect(mockEvent.target.src).toBe('/assets/instances/eagle/app_logos/default.png')
    })

    it('should correctly add Chip for tag input', () => {
        // Setup
        component.selectedtags = ['angular']
        const input = { value: 'react' }
        const mockEvent = {
            input,
            value: 'react'
        }

        // Execute
        component.addActivity(mockEvent as any)

        // Assert
        expect(component.selectedtags).toEqual(['angular', 'react'])
        expect(component.isTagsEdited).toBe(true)
        expect(component.updateProfessionalForm.controls['tags'].value).toBe(null)
    })

    it('should load designations on init', async () => {
        // Assert
        expect(mockUsersService.getDesignations).toHaveBeenCalled()
        expect(component.designationsMeta).toEqual(['Developer', 'Designer', 'Manager', 'Other'])
    })

    it('should update designation field when otherDropDownChange is called with valid value', () => {
        // Execute
        component.otherDropDownChange('Manager', 'designation')

        // Assert
        expect(component.updateProfessionalForm.controls['designation'].value).toBe('Manager')
    })

    it('should not update designation field when otherDropDownChange is called with "Other"', () => {
        // Setup
        component.updateProfessionalForm.controls['designation'].setValue('Developer')

        // Execute
        component.otherDropDownChange('Other', 'designation')

        // Assert
        expect(component.updateProfessionalForm.controls['designation'].value).toBe('Developer')
    })

    it('should update elementPosition after view initialization', () => {
        // Execute
        component.ngAfterViewInit()

        // Assert
        expect(component.elementPosition).toBe(100)
    })
})