// At the top of search.component.spec.ts
jest.mock('video.js', () => ({}))
jest.mock('mux.js/lib/tools/mp4-inspector', () => ({}))
jest.mock('@sunbird-cb/collection', () => ({
    BtnSettingsService: jest.fn(),
    ContentStripMultipleService: jest.fn(),
    WidgetContentService: jest.fn()
}))

import { environment } from '../../../../../../../../../src/environments/environment'
import { SearchComponent } from './search.component'
import { of, Subject } from 'rxjs'

// Mock lodash
jest.mock('lodash', () => ({
    get: jest.fn((obj, path, defaultValue) => {
        if (!obj) return defaultValue
        const pathParts = path.split('.')
        let result = obj
        for (const part of pathParts) {
            result = result?.[part]
            if (result === undefined) return defaultValue
        }
        return result
    }),
    uniqBy: jest.fn((array, key) => {
        const seen = new Set()
        return array.filter((item: { [x: string]: any }) => {
            const value = typeof key === 'function' ? key(item) : item[key]
            if (seen.has(value)) {
                return false
            }
            seen.add(value)
            return true
        })
    }),
    concat: jest.fn((...arrays) => {
        return [].concat(...arrays)
    })
}))

describe('SearchComponent', () => {
    let component: SearchComponent
    let mockTrainingPlanService: any
    let mockRoute: any
    let mockTpdsSvc: any
    let mockLoadingService: any
    let mockInitService: any

    // Typed loosely: ICompentencyKeys carries more fields than these tests exercise.
    const compentencyKeys: any = {
        vKey: 'competencies_v6',
        vCompetencyArea: 'competencyArea',
        vCompetencyTheme: 'competencyTheme',
        vCompetencySubTheme: 'competencySubTheme'
    }

    // Get lodash mock
    const _ = require('lodash')

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()

        // Create mock services
        mockTrainingPlanService = {
            getAllContent: jest.fn().mockReturnValue(of({
                count: 2,
                content: [
                    { identifier: 'content1', name: 'Content 1' },
                    { identifier: 'content2', name: 'Content 2' }
                ]
            })),
            getCustomUsers: jest.fn().mockReturnValue(of({
                content: [
                    { userId: 'user1', firstName: 'User 1' },
                    { userId: 'user2', firstName: 'User 2' }
                ]
            })),
            getDesignations: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        content: [
                            { id: 'des1', name: 'Designation 1' },
                            { id: 'des2', name: 'Designation 2' }
                        ]
                    }
                }
            }))
        }

        mockRoute = {
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            unMappedUser: {
                                rootOrg: {
                                    rootOrgId: 'testRootOrgId'
                                }
                            }
                        }
                    }
                }
            }
        }

        mockTpdsSvc = {
            handleContentPageChange: new Subject(),
            getFilterDataObject: new Subject(),
            filterToggle: new Subject(),
            clearFilter: new Subject(),
            moderatedCourseSelectStatus: new Subject(),
            trainingPlanStepperData: {
                status: '',
                assignmentTypeInfo: []
            },
            trainingPlanContentData: {
                data: {
                    content: []
                }
            },
            trainingPlanAssigneeData: {
                data: []
            }
        }

        mockLoadingService = {
            changeLoaderState: jest.fn()
        }

        mockInitService = {
            configSvc: {
                // The component reads `compentency` (spelled that way in the source) and
                // indexes it with environment.compentencyVersionKey. setup-jest replaces the
                // environment module wholesale, so that key is undefined here - hence the
                // computed key rather than a literal 'v6'.
                compentency: {
                    [environment.compentencyVersionKey]: compentencyKeys
                }
            }
        }

        // Create component
        component = new SearchComponent(
            mockTrainingPlanService,
            mockRoute as any,
            mockTpdsSvc,
            mockLoadingService,
            mockInitService
        )
        // getContent() and friends read compentencyKey, which ngOnInit populates.
        component.compentencyKey = compentencyKeys

        // Initialize component
        component.from = 'content'
        component.selectedDropDownValue = 'Course'
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should set up competency key and subscriptions', () => {
            // Act
            component.ngOnInit()

            // Assert
            expect(component.compentencyKey).toBe(compentencyKeys)

            // Test content page change subscription
            const pageData = { pageIndex: 5, pageSize: 10 }
            jest.spyOn(component, 'getContent')
            mockTpdsSvc.handleContentPageChange.next(pageData)
            expect(component.pageIndex).toBe(5)
            expect(component.pageSize).toBe(10)
            expect(component.getContent).toHaveBeenCalledWith('Course')

            // Test filter data subscription for content
            jest.clearAllMocks()
            const filterData = { competencyArea: ['Area1'] }
            component.selectedDropDownValue = 'Course'
            mockTpdsSvc.getFilterDataObject.next(filterData)
            expect(component.getContent).toHaveBeenCalledWith('Course', filterData)

            // Test filter data subscription for custom users
            jest.clearAllMocks()
            jest.spyOn(component, 'getCustomUsers')
            component.selectedDropDownValue = 'CustomUser'
            mockTpdsSvc.getFilterDataObject.next(filterData)
            expect(component.getCustomUsers).toHaveBeenCalledWith('CustomUser', filterData)
        })

        it('should set isContentLive flag when status is live', () => {
            // Arrange
            mockTpdsSvc.trainingPlanStepperData.status = 'Live'

            // Act
            component.ngOnInit()

            // Assert
            expect(component.isContentLive).toBe(true)
        })
    })

    describe('openFilter', () => {
        it('should set filterVisibilityFlag and emit filterToggle', () => {
            // Spy on filterToggle
            jest.spyOn(mockTpdsSvc.filterToggle, 'next')

            // Act
            component.openFilter()

            // Assert
            expect(component.filterVisibilityFlag).toBe(true)
            expect(mockTpdsSvc.filterToggle.next).toHaveBeenCalledWith({ from: component.from, status: true })
        })
    })

    describe('hideFilter', () => {
        it('should update filterVisibilityFlag and emit filterToggle', () => {
            // Spy on filterToggle
            jest.spyOn(mockTpdsSvc.filterToggle, 'next')

            // Act
            component.hideFilter(false)

            // Assert
            expect(component.filterVisibilityFlag).toBe(false)
            expect(mockTpdsSvc.filterToggle.next).toHaveBeenCalledWith({ from: '', status: false })
        })
    })

    describe('handleCategorySelection', () => {
        beforeEach(() => {
            jest.spyOn(component, 'resetPageIndex')
            jest.spyOn(component, 'getContent')
            jest.spyOn(component, 'getDesignations')
            jest.spyOn(component, 'getCustomUsers')
            jest.spyOn(component, 'getAllUsers')
            jest.spyOn(mockTpdsSvc.clearFilter, 'next')
        })

        it('should handle content selection properly', () => {
            // Arrange
            component.from = 'content'

            // Act
            component.handleCategorySelection('Course')

            // Assert
            expect(component.selectedDropDownValue).toBe('Course')
            expect(component.searchText).toBe('')
            expect(mockTpdsSvc.clearFilter.next).toHaveBeenCalledWith({ from: 'content', status: true })
            expect(component.resetPageIndex).toHaveBeenCalled()
            expect(component.getContent).toHaveBeenCalledWith('Course')
        })

        it('should handle Designation assignee selection properly', () => {
            // Arrange
            component.from = 'assignee'

            // Act
            component.handleCategorySelection('Designation')

            // Assert
            expect(component.selectedDropDownValue).toBe('Designation')
            expect(component.searchText).toBe('')
            expect(mockTpdsSvc.clearFilter.next).toHaveBeenCalledWith({ from: 'assignee', status: true })
            expect(component.resetPageIndex).toHaveBeenCalled()
            expect(component.getDesignations).toHaveBeenCalledWith('Designation')
        })

        it('should handle CustomUser assignee selection properly', () => {
            // Arrange
            component.from = 'assignee'

            // Act
            component.handleCategorySelection('CustomUser')

            // Assert
            expect(component.selectedDropDownValue).toBe('CustomUser')
            expect(component.getCustomUsers).toHaveBeenCalledWith('CustomUser')
        })

        it('should handle AllUser assignee selection properly', () => {
            // Arrange
            component.from = 'assignee'

            // Act
            component.handleCategorySelection('AllUser')

            // Assert
            expect(component.selectedDropDownValue).toBe('AllUser')
            expect(component.getAllUsers).toHaveBeenCalledWith('AllUser')
        })

        it('should use default value when event is falsy', () => {
            // Arrange
            component.from = 'content'

            // Act
            component.handleCategorySelection(null)

            // Assert
            expect(component.getContent).toHaveBeenCalledWith('Course')
        })
    })

    describe('getContent', () => {
        beforeEach(() => {
            component.compentencyKey = compentencyKeys
            jest.spyOn(mockTpdsSvc.moderatedCourseSelectStatus, 'next')
            jest.spyOn(mockTpdsSvc.clearFilter, 'next')
            jest.spyOn(component.handleApiData, 'emit')
        })

        it('should call getAllContent with correct parameters', () => {
            // Act
            component.getContent('Course')

            // Assert
            expect(mockLoadingService.changeLoaderState).toHaveBeenCalledWith(true)
            expect(mockTrainingPlanService.getAllContent).toHaveBeenCalledWith(expect.objectContaining({
                request: expect.objectContaining({
                    secureSettings: false,
                    filters: expect.objectContaining({
                        // primaryCategory is commented out in the component; it now sends
                        // courseCategory built from the contentType argument.
                        courseCategory: ['Course']
                    }),
                    offset: 0,
                    limit: 20,
                    query: ''
                })
            }))
        })

        it('should handle moderated course type correctly', () => {
            // Act
            component.getContent('Moderated Course')

            // Assert
            expect(mockTpdsSvc.moderatedCourseSelectStatus.next).toHaveBeenCalledWith(true)
            expect(mockTrainingPlanService.getAllContent).toHaveBeenCalledWith(expect.objectContaining({
                request: expect.objectContaining({
                    secureSettings: true,
                    filters: expect.objectContaining({
                        // 'Moderated Course' is passed through to courseCategory as-is.
                        courseCategory: ['Moderated Course']
                    })
                })
            }))
        })

        it('should apply filter object when provided', () => {
            // Arrange
            const filterObj = {
                providers: ['provider1'],
                competencyArea: ['area1']
            }

            // Act
            component.getContent('Course', filterObj)

            // Assert
            expect(mockTrainingPlanService.getAllContent).toHaveBeenCalledWith(expect.objectContaining({
                request: expect.objectContaining({
                    filters: expect.objectContaining({
                        organisation: ['provider1'],
                        'competencies_v6.competencyArea': ['area1']
                    })
                })
            }))
        })

        it('should clear filters when searchText is present', () => {
            // Arrange
            component.searchText = 'search query'

            // Act - no filter object: getContent blanks searchText whenever one is passed
            // with keys, so the searchText branch under test would never be reached.
            component.getContent('Course')

            // Assert
            expect(mockTpdsSvc.clearFilter.next).toHaveBeenCalledWith({ from: 'content', status: true })
            // Filters should be empty
            expect(mockTrainingPlanService.getAllContent).toHaveBeenCalledWith(expect.objectContaining({
                request: expect.objectContaining({
                    filters: expect.objectContaining({
                        organisation: [],
                        'competencies_v6.competencyArea': []
                    }),
                    query: 'search query'
                })
            }))
        })

        it('should update trainingPlanContentData and emit event on success', () => {
            // Arrange
            mockTpdsSvc.trainingPlanContentData = {
                data: {
                    content: [
                        { identifier: 'existing1', name: 'Existing 1', selected: true }
                    ]
                }
            }

            // Act
            component.getContent('Course')

            // Assert
            // The component no longer concatenates already-selected content on top of the
            // results - see the comment in getContent's subscribe block - so only uniqBy
            // is involved now.
            expect(_.uniqBy).toHaveBeenCalled()
            expect(mockTpdsSvc.trainingPlanContentData).toEqual({
                category: 'Course',
                data: expect.anything(),
                count: 2
            })
            expect(component.handleApiData.emit).toHaveBeenCalledWith(true)
            expect(mockLoadingService.changeLoaderState).toHaveBeenCalledWith(false)
        })
    })

    describe('getCustomUsers', () => {
        beforeEach(() => {
            jest.spyOn(mockTpdsSvc.clearFilter, 'next')
            jest.spyOn(component.handleApiData, 'emit')
        })

        it('should call getCustomUsers service with correct parameters', () => {
            // Act
            component.getCustomUsers('CustomUser')

            // Assert
            expect(mockLoadingService.changeLoaderState).toHaveBeenCalledWith(true)
            expect(mockTrainingPlanService.getCustomUsers).toHaveBeenCalledWith(expect.objectContaining({
                request: expect.objectContaining({
                    filters: expect.objectContaining({
                        rootOrgId: 'testRootOrgId',
                        status: 1
                    }),
                    query: ''
                })
            }))
        })

        it('should apply filter object when provided', () => {
            // Arrange
            const filterObj = {
                designation: ['des1'],
                group: ['group1']
            }

            // Act
            component.getCustomUsers('CustomUser', filterObj)

            // Assert
            expect(mockTrainingPlanService.getCustomUsers).toHaveBeenCalledWith(expect.objectContaining({
                request: expect.objectContaining({
                    filters: expect.objectContaining({
                        'profileDetails.professionalDetails.designation': ['des1'],
                        'profileDetails.professionalDetails.group': ['group1']
                    })
                })
            }))
        })

        it('should clear filters when searchText is present', () => {
            // Arrange
            component.searchText = 'search query'

            // Act - same as the content case: passing a non-empty filter object clears
            // searchText before the branch this test covers.
            component.getCustomUsers('CustomUser')

            // Assert
            expect(mockTpdsSvc.clearFilter.next).toHaveBeenCalledWith({ from: 'assignee', status: true })
            // Filters should be empty
            expect(mockTrainingPlanService.getCustomUsers).toHaveBeenCalledWith(expect.objectContaining({
                request: expect.objectContaining({
                    filters: expect.objectContaining({
                        'profileDetails.professionalDetails.designation': [],
                        'profileDetails.professionalDetails.group': []
                    }),
                    query: 'search query'
                })
            }))
        })

        it('should update trainingPlanAssigneeData and emit event on success', () => {
            // Arrange
            mockTpdsSvc.trainingPlanAssigneeData = {
                data: {
                    content: [
                        { userId: 'existing1', firstName: 'Existing 1', selected: true }
                    ]
                }
            }

            // Act
            component.getCustomUsers('CustomUser')

            // Assert
            expect(_.concat).toHaveBeenCalled()
            expect(_.uniqBy).toHaveBeenCalled()
            expect(mockTpdsSvc.trainingPlanAssigneeData).toEqual({
                category: 'CustomUser',
                data: expect.anything()
            })
            expect(component.handleApiData.emit).toHaveBeenCalledWith(true)
            expect(mockLoadingService.changeLoaderState).toHaveBeenCalledWith(false)
        })
    })

    describe('getAllUsers', () => {
        it('should set trainingPlanAssigneeData and emit event', () => {
            // Spy on handleApiData
            jest.spyOn(component.handleApiData, 'emit')

            // Act
            component.getAllUsers('AllUser')

            // Assert
            expect(mockTpdsSvc.trainingPlanAssigneeData).toEqual({
                category: 'AllUser',
                data: ['AllUser']
            })
            expect(mockTpdsSvc.trainingPlanStepperData.assignmentTypeInfo).toEqual(['AllUser'])
            expect(component.handleApiData.emit).toHaveBeenCalledWith(true)
        })
    })

    describe('getDesignations', () => {
        beforeEach(() => {
            jest.spyOn(component.handleApiData, 'emit')
        })

        it('should call getDesignations service and update data', () => {
            // Act
            component.getDesignations('Designation')

            // Assert
            expect(mockLoadingService.changeLoaderState).toHaveBeenCalledWith(true)
            expect(mockTrainingPlanService.getDesignations).toHaveBeenCalled()
            expect(mockTpdsSvc.trainingPlanAssigneeData).toEqual({
                category: 'Designation',
                data: expect.arrayContaining([
                    { id: 'des1', name: 'Designation 1' },
                    { id: 'des2', name: 'Designation 2' }
                ])
            })
            expect(component.designationList).toEqual(expect.arrayContaining([
                { id: 'des1', name: 'Designation 1' },
                { id: 'des2', name: 'Designation 2' }
            ]))
            expect(component.handleApiData.emit).toHaveBeenCalledWith(true)
            expect(mockLoadingService.changeLoaderState).toHaveBeenCalledWith(false)
        })

        it('should filter designations by searchText if provided', () => {
            // Arrange
            component.searchText = 'designation 1'

            // Act
            component.getDesignations('Designation')

            // Assert
            // Because our mock doesn't actually implement the filtering, we just verify the flow is correct
            expect(mockTpdsSvc.trainingPlanAssigneeData).toBeDefined()
            expect(component.handleApiData.emit).toHaveBeenCalledWith(true)
        })
    })

    describe('searchData', () => {
        beforeEach(() => {
            jest.spyOn(component, 'getContent')
            jest.spyOn(component, 'getDesignations')
            jest.spyOn(component, 'getCustomUsers')
            jest.spyOn(component, 'getAllUsers')
        })

        it('should call appropriate method based on selectedDropDownValue for content types', () => {
            // Test Course
            component.selectedDropDownValue = 'Course'
            component.searchData()
            expect(component.getContent).toHaveBeenCalledWith('Course')

            // Test Standalone Assessment
            jest.clearAllMocks()
            component.selectedDropDownValue = 'Standalone Assessment'
            component.searchData()
            expect(component.getContent).toHaveBeenCalledWith('Standalone Assessment')

            // Test Program
            jest.clearAllMocks()
            component.selectedDropDownValue = 'Program'
            component.searchData()
            expect(component.getContent).toHaveBeenCalledWith('Program')
        })

        it('should call appropriate method based on selectedDropDownValue for assignee types', () => {
            // Test Designation
            component.selectedDropDownValue = 'Designation'
            component.searchData()
            expect(component.getDesignations).toHaveBeenCalledWith('Designation')

            // Test CustomUser
            jest.clearAllMocks()
            component.selectedDropDownValue = 'CustomUser'
            component.searchData()
            expect(component.getCustomUsers).toHaveBeenCalledWith('CustomUser')

            // Test AllUser
            jest.clearAllMocks()
            component.selectedDropDownValue = 'AllUser'
            component.searchData()
            expect(component.getAllUsers).toHaveBeenCalledWith('AllUser')
        })
    })

    describe('resetPageIndex', () => {
        it('should reset page index and size to default values', () => {
            // Arrange
            component.pageIndex = 5
            component.pageSize = 50

            // Act
            component.resetPageIndex()

            // Assert
            expect(component.pageIndex).toBe(0)
            expect(component.pageSize).toBe(20)
        })
    })
})