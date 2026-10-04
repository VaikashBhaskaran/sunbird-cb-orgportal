import { AdmintableComponent } from './admintable.component'
import { MatTableDataSource } from '@angular/material/table'
import { MatPaginator } from '@angular/material/paginator'
import { of, throwError } from 'rxjs'

describe('AdmintableComponent', () => {
    let component: AdmintableComponent
    let mockDialog: any
    let mockSnackBar: any
    let mockMdoInfoService: any
    let mockRouter: any
    let mockProfileUtilSvc: any
    let mockMatPaginator: any
    // let mockMatSort: any

    beforeEach(() => {
        // Mock dependencies
        mockDialog = {
            open: jest.fn().mockReturnValue({
                afterClosed: () => of(null)
            })
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockMdoInfoService = {
            getTeamUsers: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        content: []
                    }
                }
            })),
            getAllUsers: jest.fn().mockReturnValue(of({
                content: []
            })),
            assignTeamRole: jest.fn().mockReturnValue(of({}))
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockProfileUtilSvc = {
            emailTransform: jest.fn(email => email)
        }

        mockMatPaginator = {
            firstPage: jest.fn()
        }

        // mockMatSort = {}

        // Create component instance
        component = new AdmintableComponent(
            mockDialog,
            mockSnackBar,
            mockMdoInfoService,
            mockRouter,
            mockProfileUtilSvc
        )

        // Set required properties
        component.paginator = mockMatPaginator as unknown as MatPaginator
        component.deptID = 'test-dept-id'
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize dataSource in constructor', () => {
        expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
    })

    it('should set displayedColumns on ngOnInit', () => {
        component.ngOnInit()
        expect(component.displayedColumns).toEqual(component.tableData.columns)
    })

    it('should call getUsers on ngOnInit', () => {
        const spy = jest.spyOn(component, 'getUsers')
        component.ngOnInit()
        expect(spy).toHaveBeenCalledWith('MDO_ADMIN')
    })

    it('should update dataSource on ngOnChanges', () => {
        const mockData = [{ id: '1', name: 'Test User' }]
        component.ngOnChanges({
            data: {
                currentValue: mockData,
                previousValue: null,
                firstChange: true,
                isFirstChange: () => true
            }
        })

        expect(component.dataSource.data).toEqual(mockData)
        expect(component.paginator.firstPage).toHaveBeenCalled()
    })

    describe('getAllUsers', () => {
        it('should call getAllUsers service and filter results', () => {
            const mockUsers = [{ id: '1', name: 'Test User' }]
            mockMdoInfoService.getAllUsers.mockReturnValueOnce(of({ content: mockUsers }))

            const filterSpy = jest.spyOn(component, 'filterAllUsers')
            component.getAllUsers('test-org-id')

            expect(mockMdoInfoService.getAllUsers).toHaveBeenCalledWith({
                request: {
                    query: '',
                    filters: {
                        rootOrgId: 'test-org-id',
                    },
                },
            })
            expect(filterSpy).toHaveBeenCalledWith(mockUsers)
        })
    })

    describe('filterAllUsers', () => {
        it('should filter users already in data array', () => {
            component.data = ['1', '2']
            component.usersData = []
            const allUsers = [
                { id: '1', name: 'User 1' },
                { id: '2', name: 'User 2' },
                { id: '3', name: 'User 3' }
            ]

            component.filterAllUsers(allUsers)

            expect(component.usersData).toEqual([{ id: '3', name: 'User 3' }])
        })

        it('should set usersData to allUsers if data is empty', () => {
            component.data = []
            const allUsers = [{ id: '1', name: 'User 1' }]

            component.filterAllUsers(allUsers)

            expect(component.usersData).toEqual(allUsers)
        })
    })

    describe('getUsers', () => {
        it('should fetch users with the specified role', () => {
            const mockUsers = [
                {
                    id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    profileDetails: {
                        professionalDetails: [{ designation: 'Developer' }]
                    }
                }
            ]

            mockMdoInfoService.getTeamUsers.mockReturnValueOnce(of({
                result: {
                    response: {
                        content: mockUsers
                    }
                }
            }))

            const getAllUsersSpy = jest.spyOn(component, 'getAllUsers')
            component.getUsers('MDO_ADMIN')

            expect(mockMdoInfoService.getTeamUsers).toHaveBeenCalledWith({
                request: {
                    filters: {
                        rootOrgId: 'test-dept-id',
                        'roles.role': ['MDO_ADMIN']
                    }
                }
            })

            expect(component.data.length).toBe(1)
            expect(component.data[0].fullname).toBe('John')
            expect(component.data[0].position).toBe('Developer')
            expect(getAllUsersSpy).toHaveBeenCalledWith('test-dept-id')
        })

        it('should handle users without profileDetails', () => {
            const mockUsers = [
                {
                    id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com'
                }
            ]

            mockMdoInfoService.getTeamUsers.mockReturnValueOnce(of({
                result: {
                    response: {
                        content: mockUsers
                    }
                }
            }))

            component.getUsers('MDO_ADMIN')

            expect(component.data.length).toBe(1)
            expect(component.data[0].position).toBe('')
        })

        it('should call getAllUsers when no users are found', () => {
            mockMdoInfoService.getTeamUsers.mockReturnValueOnce(of({
                result: {
                    response: {
                        content: []
                    }
                }
            }))

            // usersData1 has no initialiser, and getUsers reads .length off it whenever the
            // response is empty, so it has to be seeded or the subscriber throws before
            // reaching the fallback. Recorded in product-bugs.md.
            component.usersData1 = []

            const getAllUsersSpy = jest.spyOn(component, 'getAllUsers')
            component.getUsers('MDO_ADMIN')

            expect(getAllUsersSpy).toHaveBeenCalledWith('test-dept-id')
        })

        it('should handle error from getTeamUsers', () => {
            mockMdoInfoService.getTeamUsers.mockReturnValueOnce(throwError('Error'))

            // Should not throw when service returns error
            expect(() => {
                component.getUsers('MDO_ADMIN')
            }).not.toThrow()
        })
    })

    describe('getFinalColumns', () => {
        it('should return columns with additional columns based on flags', () => {
            component.tableData.needCheckBox = true
            component.tableData.needHash = true

            const columns = component.getFinalColumns()

            // Should have 'select', 'SR', and the 4 existing columns, plus 'Menu'
            expect(columns).toHaveLength(7)
            expect(columns).toContain('select')
            expect(columns).toContain('SR')
            expect(columns).toContain('Menu')
        })
    })

    describe('adduser', () => {
        it('should open dialog and handle result', () => {
            const mockDialogRef = {
                afterClosed: jest.fn().mockReturnValue(of({
                    data: [{ id: '1' }]
                }))
            }

            mockDialog.open.mockReturnValue(mockDialogRef)

            component.usersData = [{ id: '1', organisations: [{ roles: [] }] }]
            const assignRoleSpy = jest.spyOn(component, 'assignRole')

            component.adduser()

            expect(mockDialog.open).toHaveBeenCalled()
            expect(assignRoleSpy).toHaveBeenCalled()
        })
    })

    describe('assignRole', () => {
        it('should add role to user and call service', () => {
            const user = {
                id: 'user1',
                organisations: [{ roles: ['EXISTING_ROLE'] }]
            }

            component.assignRole(user)

            expect(mockMdoInfoService.assignTeamRole).toHaveBeenCalledWith({
                request: {
                    organisationId: 'test-dept-id',
                    userId: 'user1',
                    roles: ['EXISTING_ROLE', 'MDO_ADMIN']
                }
            })
            expect(mockSnackBar.open).toHaveBeenCalledWith('User is added successfully!', 'X', { duration: 5000 })
        })
    })

    describe('applyFilter', () => {
        it('should set filter on dataSource when value provided', () => {
            component.applyFilter('Test Filter')
            expect(component.dataSource.filter).toBe('test filter')
        })

        it('should clear filter when no value provided', () => {
            component.dataSource.filter = 'existing'
            component.applyFilter(null)
            expect(component.dataSource.filter).toBe('')
        })
    })

    describe('updateData', () => {
        it('should navigate to user details with correct parameters', () => {
            const rowData = { id: 'user1' }
            component.updateData(rowData)

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['/app/users/user1/details'],
                { queryParams: { param: 'MDOinfo', path: 'Leadership' } }
            )
        })
    })
})