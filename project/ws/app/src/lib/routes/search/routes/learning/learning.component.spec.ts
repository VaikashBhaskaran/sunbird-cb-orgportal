import { LearningComponent } from './learning.component'
import { of, Subject } from 'rxjs'
import { ActivatedRoute, Router } from '@angular/router'
import { ValueService, ConfigurationsService, UtilityService } from '@sunbird-cb/utils-v2'
import { SearchServService } from '../../services/search-serv.service'

describe('LearningComponent', () => {
    let component: LearningComponent
    let activatedRouteMock: Partial<ActivatedRoute>
    let routerMock: Partial<Router>
    let valueServiceMock: Partial<ValueService>
    let searchServMock: Partial<SearchServService>
    let configServiceMock: Partial<ConfigurationsService>
    let utilityServiceMock: Partial<UtilityService>

    const isLtMediumSubject = new Subject<boolean>()
    const prefChangeNotifierSubject = new Subject<any>()

    const mockPageData = {
        data: {
            search: {
                tabs: [
                    {
                        titleKey: 'learning',
                        searchQuery: {
                            filters: {
                                contentType: ['Course']
                            }
                        },
                        phraseSearch: true,
                        isStandAlone: true,
                        acrossPreferredLang: true
                    }
                ]
            }
        }
    }

    const mockQueryParamMap = {
        has: jest.fn(),
        get: jest.fn(),
    }

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Create mock services
        activatedRouteMock = {
            // ngOnInit reads snapshot.data.pageData.data straight away, so the snapshot has
            // to be present for any test in this file to get past it.
            snapshot: {
                data: {
                    pageroute: 'learning',
                    pageData: mockPageData
                },
                queryParamMap: mockQueryParamMap as any
            } as any,
            queryParamMap: of(mockQueryParamMap as any),
            parent: {} as any
        }

        routerMock = {
            // The component chains .then() onto navigate().
            navigate: jest.fn().mockResolvedValue(true)
        }

        valueServiceMock = {
            isLtMedium$: isLtMediumSubject.asObservable()
        }

        searchServMock = {
            getLearning: jest.fn().mockReturnValue(of({
                totalHits: 10,
                result: [{ id: 1 }, { id: 2 }],
                filters: [],
                queryUsed: 'test',
                doYouMean: []
            })),
            updateSelectedFiltersSet: jest.fn().mockReturnValue({ filterSet: new Set(), filterReset: false }),
            getLanguageSearchIndex: jest.fn().mockReturnValue('en'),
            translateSearchFilters: jest.fn().mockReturnValue(Promise.resolve({})),
            handleFilters: jest.fn().mockReturnValue({ filtersRes: [] }),
            raiseSearchEvent: jest.fn(),
            raiseSearchResponseEvent: jest.fn()
        }

        configServiceMock = {
            activeLocale: { locals: ['en'] } as any,
            isIntranetAllowed: true,
            // ngOnInit subscribes to this immediately.
            prefChangeNotifier: prefChangeNotifierSubject.asObservable() as any,
            userPreference: {
                selectedLocale: 'en',
                selectedLangGroup: 'en'
            } as any
        }

        utilityServiceMock = {
            isMobile: false
        }

        // Create component instance
        component = new LearningComponent(
            activatedRouteMock as ActivatedRoute,
            routerMock as Router,
            valueServiceMock as ValueService,
            searchServMock as SearchServService,
            configServiceMock as ConfigurationsService,
            utilityServiceMock as UtilityService
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        beforeEach(() => {
            mockQueryParamMap.has.mockImplementation((param) => {
                if (param === 'q') return true
                if (param === 'f') return true
                if (param === 'sort') return false
                return false
            })

            mockQueryParamMap.get.mockImplementation((param) => {
                if (param === 'q') return 'test query'
                if (param === 'f') return '{"contentType":["Course"]}'
                return null
            })
        })

        it('should initialize search configuration and subscribe to query params', () => {
            component.ngOnInit()

            expect(searchServMock.translateSearchFilters).toHaveBeenCalledWith('en')
            // The fixture enables phraseSearch, so a multi-word query is quoted - see
            // 'should apply phrase search for multi-word queries'.
            expect(component.searchRequestObject.query).toBe('"test query"')
            expect(component.searchRequestObject.filters).toHaveProperty('contentType')
            expect(searchServMock.getLearning).toHaveBeenCalled()
        })

        it('should update screen size based on value service', () => {
            component.ngOnInit()
            isLtMediumSubject.next(true)

            expect(component.screenSizeIsLtMedium).toBe(true)
            expect(component.sideNavBarOpened).toBe(false)
        })

        it('should apply default filters when no filters are specified', () => {
            mockQueryParamMap.has.mockImplementation(param => param !== 'f')
            mockQueryParamMap.get.mockImplementation(param => param === 'q' ? 'test' : null)

            component.ngOnInit()

            expect(routerMock.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: expect.objectContaining({
                        f: expect.any(String)
                    })
                })
            )
        })
    })

    describe('getResults', () => {
        beforeEach(() => {
            component.searchRequestObject = {
                query: 'test query',
                filters: {},
                pageNo: 0,
                pageSize: 10,
                sort: [],
                locale: ['en'],
                instanceCatalog: true,
                didYouMean: true
            }
            component.searchResults = {
                totalHits: 0,
                result: [],
                filters: [],
                filtersUsed: [],
                notVisibleFilters: []
            }
        })

        it('should fetch search results and update component state', () => {
            component.getResults()

            expect(searchServMock.raiseSearchEvent).toHaveBeenCalled()
            expect(searchServMock.getLearning).toHaveBeenCalledWith(component.searchRequestObject)
            expect(component.searchResults.totalHits).toBe(10)
            expect(component.searchResults.result.length).toBe(2)
            expect(component.searchRequestStatus).toBe('hasMore')
        })

        it('should apply phrase search for multi-word queries', () => {
            component.searchRequestObject.query = 'multiple words'

            component.getResults()

            expect(component.searchRequestObject.query).toBe('"multiple words"')
        })

        it('should handle 0 results with default filters by removing them', () => {
            searchServMock.getLearning = jest.fn().mockReturnValue(of({
                totalHits: 0,
                result: [],
                filters: []
            }))
            jest.spyOn(component, 'isDefaultFilterApplied', 'get').mockReturnValue(true)
            jest.spyOn(component, 'removeDefaultFiltersApplied').mockImplementation()

            component.getResults()

            expect(component.removeDefaultFiltersApplied).toHaveBeenCalled()
        })

        it('should handle 0 results across preferred languages', () => {
            searchServMock.getLearning = jest.fn().mockReturnValue(of({
                totalHits: 0,
                result: [],
                filters: []
            }))
            jest.spyOn(component, 'isDefaultFilterApplied', 'get').mockReturnValue(false)
            jest.spyOn(component, 'searchAcrossPreferredLang', 'get').mockReturnValue(true)
            component.expandToPrefLang = true
            jest.spyOn(component, 'searchWithPreferredLanguage').mockImplementation()

            component.getResults()

            expect(component.searchWithPreferredLanguage).toHaveBeenCalled()
        })
    })

    describe('utility methods', () => {
        it('should return correct sort configuration', () => {
            expect(component.getSortType('lastUpdatedOn')).toEqual([{ lastUpdatedOn: 'desc' }])
            expect(component.getSortType('duration')).toEqual([{ duration: 'desc' }])
            expect(component.getSortType('size')).toEqual([{ size: 'desc' }])
            expect(component.getSortType('unknown')).toEqual([{ lastUpdatedOn: 'desc' }])
        })

        it('should navigate with correct sort params', () => {
            component.sortOrder('duration')

            expect(routerMock.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: { sort: 'duration' },
                    queryParamsHandling: 'merge'
                })
            )
        })

        it('should navigate with correct language params', () => {
            component.searchLanguage('hi')

            expect(routerMock.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: { lang: 'hi' },
                    queryParamsHandling: 'merge'
                })
            )
        })

        it('should remove all filters when removeFilters is called', () => {
            component.searchRequestObject.query = 'test'
            component.removeFilters()

            expect(routerMock.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: { f: null, q: 'test' }
                })
            )
        })

        it('should remove language filter when removeLanguage is called', () => {
            component.searchRequest = {
                query: 'test',
                filters: { contentType: ['Course'] }
            }
            component.searchRequestObject.query = 'test'
            component.removeLanguage()

            expect(routerMock.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: {
                        f: JSON.stringify({ contentType: ['Course'] }),
                        q: 'test',
                        lang: null
                    }
                })
            )
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from all subscriptions', () => {
            const searchResultsSubscription = { unsubscribe: jest.fn() }
            const defaultSideNavBarOpenedSubscription = { unsubscribe: jest.fn() }
            const prefChangeSubscription = { unsubscribe: jest.fn() }

            component.searchResultsSubscription = searchResultsSubscription as any
            component.defaultSideNavBarOpenedSubscription = defaultSideNavBarOpenedSubscription as any
            component.prefChangeSubscription = prefChangeSubscription as any

            component.ngOnDestroy()

            expect(searchResultsSubscription.unsubscribe).toHaveBeenCalled()
            expect(defaultSideNavBarOpenedSubscription.unsubscribe).toHaveBeenCalled()
            expect(prefChangeSubscription.unsubscribe).toHaveBeenCalled()
        })
    })
})