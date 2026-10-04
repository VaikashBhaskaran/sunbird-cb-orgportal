import { SocialComponent } from './social.component'
import { Router, ActivatedRoute } from '@angular/router'
import { SearchServService } from '../../services/search-serv.service'
import { ValueService } from '@sunbird-cb/utils-v2'
import { of, throwError } from 'rxjs'

describe('SocialComponent', () => {
    let component: SocialComponent
    let mockRouter: jest.Mocked<Router>
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>
    let mockSearchService: jest.Mocked<SearchServService>
    let mockValueService: jest.Mocked<ValueService>

    beforeEach(() => {
        // Create mock implementations
        mockRouter = {
            navigate: jest.fn(),
        } as any

        mockActivatedRoute = {
            queryParamMap: of(new Map([
                ['q', 'test query'],
                ['f', JSON.stringify({ category: ['test'] })],
                ['sort', 'Latest'],
                ['social', 'Query']
            ])),
            parent: {} as any,
        } as any

        mockSearchService = {
            fetchSocialSearchUsers: jest.fn().mockReturnValue(
                of({
                    total: 10,
                    filters: [],
                    result: [{ id: '1', name: 'Test User' }],
                })
            ),
            updateSelectedFiltersSet: jest.fn().mockReturnValue({
                filterSet: new Set(['test']),
                filterReset: true,
            }),
            handleFilters: jest.fn().mockReturnValue({
                filtersRes: [],
            }),
        } as any

        mockValueService = {
            isLtMedium$: of(false),
        } as any

        // Create component instance with mocked dependencies
        component = new SocialComponent(
            mockActivatedRoute,
            mockRouter,
            mockValueService,
            mockSearchService
        )
    })

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            component.ngOnInit()

            expect(component.screenSizeIsLtMedium).toBe(false)
            expect(component.sideNavBarOpened).toBe(true)
            expect(component.searchRequestObject.query).toBe('test query')
            expect(component.searchRequestObject.postKind).toBe('Query')
        })

        it('should handle screen size changes', () => {
            // The component captures isLtMedium$ in a field initializer at construction, so
            // swapping it on the service afterwards has no effect - set it on the instance.
            (component as any).isLtMedium$ = of(true)

            component.ngOnInit()

            expect(component.screenSizeIsLtMedium).toBe(true)
            expect(component.sideNavBarOpened).toBe(false)
        })
    })

    describe('Search Results Fetching', () => {
        it('should fetch search results successfully', () => {
            // ngOnInit already triggers a fetch via the query-param subscription, and
            // getResults appends to searchResults.result rather than replacing it, so reset
            // the accumulator to measure a single call.
            component.ngOnInit()
            component.searchResults.result = []
            component.getResults()

            expect(mockSearchService.fetchSocialSearchUsers).toHaveBeenCalled()
            expect(component.searchResults.total).toBe(10)
            expect(component.searchResults.result.length).toBe(1)
            expect(component.searchRequestStatus).toBe('hasMore')
        })

        it('should handle error when fetching results', () => {
            const mockError = new Error('Search failed')
            mockSearchService.fetchSocialSearchUsers.mockReturnValue(
                throwError(mockError)
            )

            component.ngOnInit()
            component.getResults()

            expect(component.error.load).toBe(true)
            expect(component.error.message).toEqual(mockError)
            expect(component.searchRequestStatus).toBe('done')
        })
    })

    describe('Filter and Navigation Methods', () => {
        it('should remove filters', () => {
            component.removeFilters()

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                {
                    queryParams: { f: null },
                    queryParamsHandling: 'merge',
                    relativeTo: mockActivatedRoute.parent,
                }
            )
        })

        it('should toggle between Query and Blog post kinds', () => {
            component.ngOnInit()
            component.toggleBestResults()

            expect(component.query).toBe(false)
            expect(component.searchRequestObject.postKind).toBe('Blog')
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                {
                    queryParams: { social: 'Blog' },
                    queryParamsHandling: 'merge',
                    relativeTo: mockActivatedRoute.parent,
                }
            )
        })

        it('should change sort order', () => {
            component.sortOrder('Trending')

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                {
                    queryParams: { sort: 'Trending' },
                    queryParamsHandling: 'merge',
                    relativeTo: mockActivatedRoute.parent,
                }
            )
        })
    })

    describe('Lifecycle Methods', () => {
        it('should unsubscribe from subscriptions on destroy', () => {
            component.ngOnInit()
            const searchResultsSubscriptionSpy = jest.spyOn(
                component['searchResultsSubscription'] as any,
                'unsubscribe'
            )
            const defaultSideNavBarSubscriptionSpy = jest.spyOn(
                component['defaultSideNavBarOpenedSubscription'] as any,
                'unsubscribe'
            )

            component.ngOnDestroy()

            expect(searchResultsSubscriptionSpy).toHaveBeenCalled()
            expect(defaultSideNavBarSubscriptionSpy).toHaveBeenCalled()
        })
    })

    describe('Utility Methods', () => {
        it('should track content by identifier', () => {
            //const testContent = { identifier: 'test-id', name: 'Test Content' }

            // const trackedId = component.contentTrackBy(testContent)

            //expect(trackedId).toBe('test-id')
        })

        it('should close filter', () => {
            component.closeFilter(false)

            expect(component.sideNavBarOpened).toBe(false)
        })
    })
})