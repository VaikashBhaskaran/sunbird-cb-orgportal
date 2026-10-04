import { PreviewPlanComponent } from './preview-plan.component'

describe('PreviewPlanComponent', () => {
    let component: PreviewPlanComponent
    let mockRouter: any
    let mockActivatedRoute: any
    let mockTpdsSvc: any

    beforeEach(() => {
        // Create mocks for the dependencies
        mockRouter = {
            navigate: jest.fn()
        }

        mockActivatedRoute = {
            snapshot: {
                data: {},
                queryParams: {}
            }
        }

        mockTpdsSvc = {
            trainingPlanContentData: null,
            trainingPlanAssigneeData: null,
            // Returns the identifiers already on the plan; the component iterates it.
            getContentIdentifiers: jest.fn().mockReturnValue([])
        }

        // Create component with mocked dependencies
        component = new PreviewPlanComponent(
            mockRouter,
            mockActivatedRoute,
            mockTpdsSvc
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit with route data', () => {
        beforeEach(() => {
            // Reset component properties
            component.contentList = []
            component.assigneeData = []
            component.allContentChips = []
            component.showBackBtn = false
        })

        it('should show the APAR year of the plan being previewed', () => {
            mockActivatedRoute.snapshot.data = {
                contentData: {
                    status: 'LIVE',
                    assignmentType: 'Designation',
                    assignmentTypeInfo: [],
                    planYear: '2025-26',
                },
            }

            component.ngOnInit()

            expect(component.planYear).toBe('2025-26')
        })

        it('should show no APAR year when the plan holds none', () => {
            mockActivatedRoute.snapshot.data = {
                contentData: {
                    status: 'LIVE',
                    assignmentType: 'Designation',
                    assignmentTypeInfo: [],
                },
            }

            component.ngOnInit()

            expect(component.planYear).toBe('')
        })

        it('should initialize from contentData with Designation assignment type', () => {
            // Arrange
            const mockContentData = {
                status: 'LIVE',
                assignmentType: 'Designation',
                contentType: 'Course',
                assignmentTypeInfo: ['Manager', 'Director'],
                contentList: [{ id: 'content1' }, { id: 'content2' }]
            }

            mockActivatedRoute.snapshot.data = { contentData: mockContentData }

            // Act
            component.ngOnInit()

            // Assert
            expect(component.showBackBtn).toBe(true)
            expect(component.form).toBe('all')
            expect(component.tab).toBe('content')
            expect(component.selectedTab).toBe('content')
            expect(component.contentList).toEqual(mockContentData.contentList)

            // Check assignee data
            expect(component.assigneeData.category).toBe('Designation')
            expect(component.assigneeData.data.length).toBe(2)
            expect(component.assigneeData.data[0].name).toBe('Manager')
            expect(component.assigneeData.data[1].name).toBe('Director')

            // Check content chips
            expect(component.allContentChips.length).toBe(2)
            expect(component.allContentChips[0].name).toBe('Course')
            expect(component.allContentChips[0].tab).toBe('content')
            expect(component.allContentChips[0].selected).toBe(true)
            expect(component.allContentChips[0].count).toBe(2)

            expect(component.allContentChips[1].name).toBe('Designation')
            expect(component.allContentChips[1].tab).toBe('assignee')
            expect(component.allContentChips[1].selected).toBe(false)
            expect(component.allContentChips[1].count).toBe(2)

            // Check navigation URL
            expect(component.navUrl).toEqual({
                url: ['app', 'home', 'training-plan-dashboard'],
                queryParams: {
                    // navUrl carries contentData.status through unchanged.
                    type: 'LIVE',
                    tabSelected: 'Designation',
                }
            })
        })

        it('should initialize from contentData with CustomUser assignment type', () => {
            // Arrange
            const mockContentData = {
                status: 'LIVE',
                assignmentType: 'CustomUser',
                contentType: 'Program',
                userDetails: [
                    { firstName: 'John', designation: 'Manager' },
                    { firstName: 'Jane', designation: 'Director' }
                ],
                contentList: [{ id: 'content1' }]
            }

            mockActivatedRoute.snapshot.data = { contentData: mockContentData }

            // Act
            component.ngOnInit()

            // Assert
            expect(component.showBackBtn).toBe(true)
            expect(component.form).toBe('all')
            expect(component.tab).toBe('content')
            expect(component.selectedTab).toBe('content')
            expect(component.contentList).toEqual(mockContentData.contentList)

            // Check assignee data
            expect(component.assigneeData.category).toBe('CustomUser')
            expect(component.assigneeData.data.length).toBe(2)
            expect(component.assigneeData.data[0].firstName).toBe('John')
            expect(component.assigneeData.data[1].firstName).toBe('Jane')

            // Check content chips
            expect(component.allContentChips.length).toBe(2)
            expect(component.allContentChips[0].name).toBe('Program')
            expect(component.allContentChips[0].tab).toBe('content')
            expect(component.allContentChips[0].selected).toBe(true)
            expect(component.allContentChips[0].count).toBe(1)

            expect(component.allContentChips[1].name).toBe('Custom User')
            expect(component.allContentChips[1].tab).toBe('assignee')
            expect(component.allContentChips[1].selected).toBe(false)
            expect(component.allContentChips[1].count).toBe(2)
        })

        it('should initialize from contentData with AllUser assignment type', () => {
            // Arrange
            const mockContentData = {
                status: 'LIVE',
                assignmentType: 'AllUser',
                contentType: 'Course',
                contentList: [{ id: 'content1' }, { id: 'content2' }, { id: 'content3' }]
            }

            mockActivatedRoute.snapshot.data = { contentData: mockContentData }

            // Act
            component.ngOnInit()

            // Assert
            expect(component.showBackBtn).toBe(true)
            expect(component.form).toBe('all')
            expect(component.tab).toBe('content')
            expect(component.selectedTab).toBe('content')
            expect(component.contentList).toEqual(mockContentData.contentList)

            // Check content chips - should only have content tab for AllUser
            expect(component.allContentChips.length).toBe(1)
            expect(component.allContentChips[0].name).toBe('Course')
            expect(component.allContentChips[0].tab).toBe('content')
            expect(component.allContentChips[0].selected).toBe(true)
            expect(component.allContentChips[0].count).toBe(3)
        })
    })

    describe('ngOnInit with form input', () => {
        it('should initialize contentList from trainingPlanContentData when form is "content"', () => {
            // Arrange
            // The content on the plan is the identifiers the service holds, resolved
            // against the content it has cached - not the "selected" flags on a page of
            // search results.
            component.form = 'content'
            mockTpdsSvc.getContentIdentifiers = jest.fn().mockReturnValue(['content1', 'content3'])
            mockTpdsSvc.trainingPlanSelectedContent = [
                { identifier: 'content1', id: 'content1' },
                { identifier: 'content2', id: 'content2' },
                { identifier: 'content3', id: 'content3' }
            ]

            // Act
            component.ngOnInit()

            // Assert
            expect(component.contentList.length).toBe(2)
            expect(component.contentList[0].id).toBe('content1')
            expect(component.contentList[1].id).toBe('content3')
        })

        it('should initialize assigneeData from trainingPlanAssigneeData with Designation category when form is "assignee"', () => {
            // Arrange
            component.form = 'assignee'
            mockTpdsSvc.trainingPlanAssigneeData = {
                category: 'Designation',
                data: [
                    { name: 'Manager', selected: true },
                    { name: 'Director', selected: false },
                    { name: 'Developer', selected: true }
                ]
            }

            // Act
            component.ngOnInit()

            // Assert
            expect(component.assigneeData.category).toBe('Designation')
            expect(component.assigneeData.data.length).toBe(2)
            expect(component.assigneeData.data[0].name).toBe('Manager')
            expect(component.assigneeData.data[1].name).toBe('Developer')
        })

        it('should initialize assigneeData from trainingPlanAssigneeData with CustomUser category when form is "assignee"', () => {
            // Arrange
            component.form = 'assignee'
            mockTpdsSvc.trainingPlanAssigneeData = {
                category: 'CustomUser',
                data: [
                    { firstName: 'John', selected: true },
                    { firstName: 'Jane', selected: false },
                    { firstName: 'Bob', selected: true }
                ]
            }

            // Act
            component.ngOnInit()

            // Assert
            expect(component.assigneeData.category).toBe('CustomUser')
            expect(component.assigneeData.data.length).toBe(2)
            expect(component.assigneeData.data[0].firstName).toBe('John')
            expect(component.assigneeData.data[1].firstName).toBe('Bob')
        })
    })

    describe('goBack', () => {
        it('should navigate to the correct URL with query params', () => {
            // Arrange
            component.navUrl = {
                url: ['app', 'home', 'training-plan-dashboard'],
                queryParams: {
                    // navUrl carries contentData.status through unchanged.
                    type: 'LIVE',
                    tabSelected: 'Designation'
                }
            }

            // Act
            component.goBack()

            // Assert
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['app', 'home', 'training-plan-dashboard'],
                { queryParams: { type: 'LIVE', tabSelected: 'Designation' } }
            )
        })
    })
})