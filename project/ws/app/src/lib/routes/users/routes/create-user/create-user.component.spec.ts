import { CreateUserComponent } from './create-user.component'
import { of, throwError } from 'rxjs'
import { NavigationEnd } from '@angular/router'

describe('CreateUserComponent', () => {
    let component: CreateUserComponent
    let mockRouter: any
    let mockActivatedRoute: any
    let mockSnackBar: any
    let mockUsersSvc: any
    let mockValueSvc: any

    beforeEach(() => {
        // Mock services
        mockRouter = {
            navigate: jest.fn(),
            events: {
                subscribe: jest.fn((fn) => {
                    fn(new NavigationEnd(1, '/app/home/users', '/app/home/users'))
                    return { unsubscribe: jest.fn() }
                })
            }
        }

        mockActivatedRoute = {
            snapshot: {
                data: {
                    configService: {
                        userRoles: new Set(['ADMIN']),
                        unMappedUser: {
                            rootOrgId: 'test-org-id',
                            channel: 'test-channel',
                            rootOrg: {
                                orgName: 'Test Department',
                                imgUrl: 'test-img-url'
                            },
                            roles: ['MDO_ADMIN']
                        },
                        userProfile: {
                            departmentName: 'Old Department'
                        }
                    },
                    rolesList: {
                        data: {
                            orgTypeList: [
                                {
                                    name: 'MDO',
                                    roles: ['PUBLIC', 'MDO_DASHBOARD_USER', 'MDO_LEADER']
                                }
                            ]
                        }
                    },
                    pageData: {
                        data: {
                            menus: {
                                widgetData: {}
                            }
                        }
                    }
                }
            },
            queryParamMap: of({
                get: (key: string) => {
                    if (key === 'param') return 'MDOinfo'
                    if (key === 'path') return 'test-path'
                    return null
                }
            })
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockUsersSvc = {
            createUser: jest.fn(),
            addUserToDepartment: jest.fn()
        }

        mockValueSvc = {
            isLtMedium$: of(false)
        }

        component = new CreateUserComponent(
            mockRouter as any,
            mockActivatedRoute as any,
            mockSnackBar as any,
            mockUsersSvc as any,
            mockValueSvc as any
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize form with required validators', () => {
        expect(component.createUserForm).toBeDefined()
        expect(component.createUserForm.get('fname')).toBeDefined()
        expect(component.createUserForm.get('email')).toBeDefined()
        expect(component.createUserForm.get('mobileNumber')).toBeDefined()
        expect(component.createUserForm.get('roles')).toBeDefined()

        // Check validators
        const fnameControl = component.createUserForm.get('fname')
        fnameControl?.setValue('')
        expect(fnameControl?.valid).toBeFalsy()
        expect(fnameControl?.hasError('required')).toBeTruthy()

        const emailControl = component.createUserForm.get('email')
        emailControl?.setValue('')
        expect(emailControl?.valid).toBeFalsy()
        expect(emailControl?.hasError('required')).toBeTruthy()

        emailControl?.setValue('invalid-email')
        expect(emailControl?.valid).toBeFalsy()
        expect(emailControl?.hasError('email')).toBeTruthy()

        const mobileControl = component.createUserForm.get('mobileNumber')
        mobileControl?.setValue('')
        expect(mobileControl?.valid).toBeFalsy()
        expect(mobileControl?.hasError('required')).toBeTruthy()

        mobileControl?.setValue('abc')
        expect(mobileControl?.valid).toBeFalsy()
        expect(mobileControl?.hasError('pattern')).toBeTruthy()

        const rolesControl = component.createUserForm.get('roles')
        rolesControl?.setValue('')
        expect(rolesControl?.valid).toBeFalsy()
        expect(rolesControl?.hasError('required')).toBeTruthy()
    })

    it('should initialize with correct department and channel data from config', () => {
        component.ngOnInit()

        expect(component.departmentName).toBe('Test Department')
        expect(component.channelName).toBe('test-channel')
        expect(component.department).toBe('test-org-id')
    })

    it('should setup the sideNavBarOpened based on screen size', () => {
        mockValueSvc.isLtMedium$ = of(true)
        component = new CreateUserComponent(
            mockRouter as any,
            mockActivatedRoute as any,
            mockSnackBar as any,
            mockUsersSvc as any,
            mockValueSvc as any
        )

        component.ngOnInit()
        expect(component.sideNavBarOpened).toBe(false)
        expect(component.screenSizeIsLtMedium).toBe(true)
    })

    it('should validate email length correctly', () => {
        // Valid email
        component.emailVerification('test@example.com')
        expect(component.emailLengthVal).toBe(false)

        // Email with username part > 64 chars
        const longUsername = 'a'.repeat(65)
        component.emailVerification(`${longUsername}@example.com`)
        expect(component.emailLengthVal).toBe(true)

        // Email with domain part > 255 chars
        const longDomain = 'a'.repeat(256)
        component.emailVerification(`test@${longDomain}.com`)
        expect(component.emailLengthVal).toBe(true)

        // Invalid email format
        component.emailVerification('invalid-email')
        expect(component.emailLengthVal).toBe(false)
    })

    it('should modify user roles correctly', () => {
        // Add role
        component.modifyUserRoles('ADMIN')
        expect(component.userRoles.has('ADMIN')).toBe(true)

        // Remove role
        component.modifyUserRoles('ADMIN')
        expect(component.userRoles.has('ADMIN')).toBe(false)

        // Add another role
        component.modifyUserRoles('USER')
        expect(component.userRoles.has('USER')).toBe(true)
    })

    it('should handle window scroll events', () => {
        // Mock element position
        component.elementPosition = 100

        // Scroll below threshold
        Object.defineProperty(window, 'pageYOffset', { value: 50, configurable: true })
        component.handleScroll()
        expect(component.sticky).toBe(false)

        // Scroll above threshold
        Object.defineProperty(window, 'pageYOffset', { value: 150, configurable: true })
        component.handleScroll()
        expect(component.sticky).toBe(true)
    })

    it('should filter roles based on MDO_ADMIN privileges', () => {
        // Check MDO_ADMIN roles (setup in beforeEach)
        expect(component.isMdoAdmin).toBe(true)
        expect(component.isMdoLeader).toBe(false)

        // Verify the roles list contains the expected roles
        expect(component.rolesList.some((r: any) => r.roleName === 'PUBLIC')).toBe(true)
        expect(component.rolesList.some((r: any) => r.roleName === 'MDO_DASHBOARD_USER')).toBe(true)
        expect(component.rolesList.some((r: any) => r.roleName === 'MDO_LEADER')).toBe(false)
    })

    it('should filter roles based on MDO_LEADER privileges', () => {
        // Setup MDO_LEADER role
        mockActivatedRoute.snapshot.data.configService.unMappedUser.roles = ['MDO_LEADER']

        component = new CreateUserComponent(
            mockRouter as any,
            mockActivatedRoute as any,
            mockSnackBar as any,
            mockUsersSvc as any,
            mockValueSvc as any
        )

        expect(component.isMdoAdmin).toBe(false)
        expect(component.isMdoLeader).toBe(true)

        // Verify the roles list contains the expected roles
        expect(component.rolesList.some((r: any) => r.roleName === 'PUBLIC')).toBe(true)
        expect(component.rolesList.some((r: any) => r.roleName === 'MDO_DASHBOARD_USER')).toBe(true)
        // MDO_LEADER should not be in the list since the current user is MDO_LEADER
        expect(component.rolesList.some((r: any) => r.roleName === 'MDO_LEADER')).toBe(false)
    })

    it('should handle numericOnly input validation', () => {
        expect(component.numericOnly({ key: '5' })).toBe(true)
        expect(component.numericOnly({ key: 'A' })).toBe(false)
        expect(component.numericOnly({ key: '#' })).toBe(false)
    })

    it('should navigate when navigateTo is called', () => {
        component.navigateTo()
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/users'])
    })

    it('should handle successful user creation', () => {
        const formValue = {
            value: {
                fname: 'Test User',
                email: 'test@example.com',
                mobileNumber: '1234567890',
                roles: ['PUBLIC']
            }
        }

        mockUsersSvc.createUser.mockReturnValue(of({ userId: 'test-user-id' }))

        component.onSubmit(formValue)

        expect(mockUsersSvc.createUser).toHaveBeenCalledWith({
            personalDetails: {
                email: 'test@example.com',
                phone: '1234567890',
                userName: 'Test User',
                firstName: 'Test User',
                channel: 'test-channel',
                roles: ['PUBLIC']
            }
        })

        expect(mockSnackBar.open).toHaveBeenCalledWith('User Created Successfully', 'X', { duration: 5000 })
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/mdoinfo/leadership'])
    })

    it('should navigate to users page when not MDOinfo param', () => {
        // Change query param
        mockActivatedRoute.queryParamMap = of({
            get: (key: string) => {
                if (key === 'param') return null
                if (key === 'path') return 'test-path'
                return null
            }
        })

        component = new CreateUserComponent(
            mockRouter as any,
            mockActivatedRoute as any,
            mockSnackBar as any,
            mockUsersSvc as any,
            mockValueSvc as any
        )

        const formValue = {
            value: {
                fname: 'Test User',
                email: 'test@example.com',
                mobileNumber: '1234567890',
                roles: ['PUBLIC']
            }
        }

        mockUsersSvc.createUser.mockReturnValue(of({ userId: 'test-user-id' }))

        component.onSubmit(formValue)

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/users'])
    })

    it('should handle errors in user creation - phone exists', () => {
        const formValue = {
            value: {
                fname: 'Test User',
                email: 'test@example.com',
                mobileNumber: '1234567890',
                roles: ['PUBLIC']
            }
        }

        mockUsersSvc.createUser.mockReturnValue(throwError({
            error: {
                params: {
                    errmsg: 'phone already exists'
                }
            }
        }))

        component.onSubmit(formValue)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Phone Number already exists', 'X', { duration: 5000 })
        expect(component.disableCreateButton).toBe(false)
        expect(component.displayLoader).toBe(false)
    })

    it('should handle errors in user creation - email exists', () => {
        const formValue = {
            value: {
                fname: 'Test User',
                email: 'test@example.com',
                mobileNumber: '1234567890',
                roles: ['PUBLIC']
            }
        }

        mockUsersSvc.createUser.mockReturnValue(throwError({
            error: {
                params: {
                    errmsg: 'email already exists'
                }
            }
        }))

        component.onSubmit(formValue)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Email Id already exists', 'X', { duration: 5000 })
        expect(component.disableCreateButton).toBe(false)
        expect(component.displayLoader).toBe(false)
    })

    it('should handle errors in user creation - invalid phone', () => {
        const formValue = {
            value: {
                fname: 'Test User',
                email: 'test@example.com',
                mobileNumber: 'invalid',
                roles: ['PUBLIC']
            }
        }

        mockUsersSvc.createUser.mockReturnValue(throwError({
            error: {
                params: {
                    errmsg: 'Invalid format for given phone.'
                }
            }
        }))

        component.onSubmit(formValue)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Please enter valid phone number', 'X', { duration: 5000 })
    })

    it('should handle generic errors in user creation', () => {
        const formValue = {
            value: {
                fname: 'Test User',
                email: 'test@example.com',
                mobileNumber: '1234567890',
                roles: ['PUBLIC']
            }
        }

        mockUsersSvc.createUser.mockReturnValue(throwError({
            error: {
                params: {
                    errmsg: 'some other error'
                }
            }
        }))

        component.onSubmit(formValue)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Some error occurred while creating user, Please try again later!', 'X', { duration: 5000 })
    })

    it('should clean up subscriptions on destroy', () => {
        // The subscription is private and created in ngOnInit, so drive that and spy on
        // the real one rather than planting a stand-in.
        component.ngOnInit()
        const subscription = (component as any).defaultSideNavBarOpenedSubscription
        expect(subscription).toBeTruthy()
        const unsubscribeSpy = jest.spyOn(subscription, 'unsubscribe')

        component.ngOnDestroy()

        expect(unsubscribeSpy).toHaveBeenCalled()
    })
})