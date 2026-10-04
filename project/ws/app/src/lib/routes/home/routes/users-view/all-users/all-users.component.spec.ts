import { AllUsersComponent } from './all-users.component'
import { of } from 'rxjs'
import * as _ from 'lodash'

describe('AllUsersComponent', () => {
    let component: AllUsersComponent
    let mockMatDialog: any
    let mockActivatedRoute: any
    let mockRouter: any
    let mockEvents: any
    let mockLoaderService: any
    let mockProfileUtilSvc: any
    let mockSanitizer: any
    let mockUsersService: any

    beforeEach(() => {
        mockMatDialog = {
            open: jest.fn()
        }

        mockActivatedRoute = {
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            unMappedUser: {
                                rootOrg: {
                                    rootOrgId: 'test-org-id',
                                    id: 'test-id'
                                },
                                roles: ['MDO_ADMIN']
                            },
                            userProfile: {
                                userId: 'test-user'
                            }
                        }
                    }
                }
            },
            parent: {
                snapshot: {
                    data: {
                        configService: {
                            unMappedUser: {
                                rootOrg: {
                                    rootOrgId: 'test-org-id',
                                    id: 'test-id'
                                },
                                roles: ['MDO_ADMIN']
                            },
                            userProfile: {
                                userId: 'test-user'
                            }
                        }
                    }
                }
            }
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockEvents = {
            handleTabTelemetry: jest.fn(),
            raiseInteractTelemetry: jest.fn()
        }

        mockLoaderService = {
            changeLoad: {
                next: jest.fn()
            }
        }

        mockProfileUtilSvc = {
            emailTransform: jest.fn(email => `${email}_transformed`)
        }

        mockSanitizer = {
            bypassSecurityTrustHtml: jest.fn(html => html)
        }

        mockUsersService = {
            // The component subscribes and reads data.result.response.content.
            getAllKongUsers: jest.fn().mockReturnValue(of({ result: { response: { content: [], count: 0 } } }))
        }

        component = new AllUsersComponent(
            mockMatDialog,
            mockActivatedRoute as any,
            mockRouter as any,
            mockEvents,
            mockLoaderService,
            mockProfileUtilSvc,
            mockSanitizer as any,
            mockUsersService
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize component properties and fetch users', () => {
            const getUsersSpy = jest.spyOn(component, 'getUsers')

            component.ngOnInit()

            expect(component.searchQuery).toBe('')
            expect(component.isMdoAdmin).toBe(true)
            expect(getUsersSpy).toHaveBeenCalledTimes(3) // allusers, verified, nonverified
            expect(component.reportsNoteList.length).toBe(4)
        })
    })

    describe('filter', () => {
        it('should update filter and reset pagination parameters', () => {
            const filterDataSpy = jest.spyOn(component, 'filterData')
            const testFilter = 'verified'

            component.filter(testFilter)

            expect(component.currentFilter).toBe(testFilter)
            expect(component.pageIndex).toBe(0)
            expect(component.currentOffset).toBe(0)
            expect(component.limit).toBe(20)
            expect(component.searchQuery).toBe('')
            expect(filterDataSpy).toHaveBeenCalledWith('')
        })
    })

    describe('tabTelemetry', () => {
        it('should call events.handleTabTelemetry with correct parameters', () => {
            const label = 'Test Tab'
            const index = 2

            component.tabTelemetry(label, index)

            expect(mockEvents.handleTabTelemetry).toHaveBeenCalledWith(
                'user-tab',
                { label, index }
            )
        })
    })

    describe('sanitizeHtml', () => {
        it('should call sanitizer.bypassSecurityTrustHtml with input html', () => {
            const testHtml = '<div>Test HTML</div>'

            component.sanitizeHtml(testHtml)

            expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(testHtml)
        })
    })

    describe('showEditUser', () => {
        it('should return true when user is MDO_ADMIN and roles exist', () => {
            component.isMdoAdmin = true
            const result = component.showEditUser(['USER'])
            expect(result).toBe(true)
        })

        it('should return true if user is not an MDO_ADMIN', () => {
            component.isMdoAdmin = false
            const result = component.showEditUser(['USER'])
            expect(result).toBe(true)
        })
    })

    describe('openVideoPopup', () => {
        it('should open dialog with ReportsVideoComponent', () => {
            component.openVideoPopup()

            expect(mockMatDialog.open).toHaveBeenCalledWith(
                expect.any(Function), // ReportsVideoComponent
                expect.objectContaining({
                    data: {
                        videoLink: 'https://www.youtube.com/embed/tgbNymZ7vqY?autoplay=1&mute=1',
                    },
                    disableClose: true,
                    width: '50%',
                    height: '60%',
                    panelClass: 'overflow-visable',
                })
            )
        })
    })

    describe('filterData', () => {
        it('should call getUsers with query and current filter', () => {
            const spy = jest.spyOn(component, 'getUsers')
            const query = 'search test'
            component.currentFilter = 'verified'

            component.filterData(query)

            expect(spy).toHaveBeenCalledWith(query, 'verified')
        })
    })

    describe('getUsers', () => {
        it('should call usersService with correct parameters and process response', () => {
            const mockUserResponse = {
                result: {
                    response: {
                        content: [
                            {
                                id: 'user1',
                                firstName: 'John',
                                personalDetails: { primaryEmail: 'john@example.com' },
                                isDeleted: false,
                                blocked: false,
                                organisations: [
                                    {
                                        organisationId: 'test-id',
                                        roles: ['USER']
                                    }
                                ],
                                rootOrgId: 'org1',
                                rootOrgName: 'Org One'
                            }
                        ],
                        count: 1
                    }
                }
            }

            mockUsersService.getAllKongUsers.mockReturnValue(of(mockUserResponse))
            component.currentFilter = 'allusers'
            component.rootOrgId = 'test-org-id'

            component.getUsers('search', 'allusers')

            expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(true)
            expect(mockUsersService.getAllKongUsers).toHaveBeenCalledWith({
                request: {
                    filters: {
                        rootOrgId: 'test-org-id',
                        status: 1
                    },
                    limit: 20,
                    offset: 0,
                    query: 'search'
                }
            })

            expect(component.activeUsersData.length).toBe(1)
            expect(component.activeUsersDataCount).toBe(1)
        })

        it('should handle filtered data for verified users', () => {
            const mockUserResponse = {
                result: {
                    response: {
                        content: [
                            {
                                id: 'user1',
                                firstName: 'John',
                                personalDetails: { primaryEmail: 'john@example.com' },
                                isDeleted: false,
                                blocked: false,
                                organisations: [
                                    {
                                        organisationId: 'test-id',
                                        roles: ['USER']
                                    }
                                ],
                                rootOrgId: 'org1',
                                rootOrgName: 'Org One'
                            }
                        ],
                        count: 1
                    }
                }
            }

            mockUsersService.getAllKongUsers.mockReturnValue(of(mockUserResponse))
            component.rootOrgId = 'test-org-id'
            // getUsers builds the request from its argument but files the response under
            // this.currentFilter, so both have to say 'verified' for the result to land in
            // verifiedUsersData. Recorded in product-bugs.md.
            component.currentFilter = 'verified'

            component.getUsers('', 'verified')

            expect(mockUsersService.getAllKongUsers).toHaveBeenCalledWith(expect.objectContaining({
                request: {
                    filters: {
                        rootOrgId: 'test-org-id',
                        'profileDetails.profileStatus': 'VERIFIED'
                    },
                    limit: 20,
                    offset: 0,
                    query: ''
                }
            }))

            expect(component.verifiedUsersData.length).toBe(1)
            expect(component.verifiedUsersDataCount).toBe(1)
        })
    })

    describe('clickHandler', () => {
        it('should call onCreateClick for createUser event', () => {
            const createSpy = jest.spyOn(component, 'onCreateClick')

            component.clickHandler({ type: 'createUser' })

            expect(createSpy).toHaveBeenCalled()
        })

        it('should call onUploadClick for upload event', () => {
            const uploadSpy = jest.spyOn(component, 'onUploadClick')

            component.clickHandler({ type: 'upload' })

            expect(uploadSpy).toHaveBeenCalled()
        })
    })

    describe('onCreateClick', () => {
        it('should navigate to create user page and raise telemetry', () => {
            component.onCreateClick()

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/users/create-user'])
            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
                {
                    type: 'click',
                    subType: 'create-btn',
                    id: 'create-user-btn',
                },
                {}
            )
        })
    })

    describe('onUploadClick', () => {
        it('should call filter with upload parameter', () => {
            const filterSpy = jest.spyOn(component, 'filter')

            component.onUploadClick()

            expect(filterSpy).toHaveBeenCalledWith('upload')
        })
    })

    describe('onRoleClick', () => {
        it('should navigate to user details and raise telemetry', () => {
            const user = { userId: 'user123' }

            component.onRoleClick(user)

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/users/user123/details'])
            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
                {
                    type: 'click',
                    subType: 'card-content',
                    id: 'user-row',
                },
                {
                    id: 'user123',
                    type: 'user',
                }
            )
        })
    })

    describe('onEnterkySearch', () => {
        it('should update searchQuery and call filterData', () => {
            const filterDataSpy = jest.spyOn(component, 'filterData')
            const searchValue = 'test search'

            component.onEnterkySearch(searchValue)

            expect(component.searchQuery).toBe(searchValue)
            expect(filterDataSpy).toHaveBeenCalledWith(searchValue)
        })
    })

    describe('onPaginateChange', () => {
        it('should update pagination parameters and call filterData', () => {
            const filterDataSpy = jest.spyOn(component, 'filterData')
            const event = { pageIndex: 2, pageSize: 15 } as any
            component.searchQuery = 'test'

            component.onPaginateChange(event)

            expect(component.pageIndex).toBe(2)
            expect(component.limit).toBe(15)
            expect(filterDataSpy).toHaveBeenCalledWith('test')
        })
    })

    describe('blockedUsers', () => {
        it('should return formatted blocked users data', () => {
            component.usersData = {
                content: [
                    {
                        id: 'user1',
                        firstName: 'John',
                        personalDetails: { primaryEmail: 'john@example.com' },
                        isDeleted: false,
                        blocked: true,
                        roleInfo: ['ADMIN', 'USER'],
                        roles: ['ADMIN', 'USER']
                    }
                ]
            }

            const result = component.blockedUsers()

            expect(result.length).toBe(1)
            expect(result[0].fullname).toBe('John')
            expect(result[0].email).toBe('john@example.com_transformed')
            expect(result[0].blocked).toBe(true)
            expect(result[0].roles).toContain('<li>ADMIN</li>')
            expect(result[0].roles).toContain('<li>USER</li>')
        })
    })
})