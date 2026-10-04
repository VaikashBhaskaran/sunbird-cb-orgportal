import '@angular/compiler'
import { Router, ActivatedRoute } from '@angular/router'
import { ConfigurationsService, EventService, ValueService } from '@sunbird-cb/utils-v2'
import { HomeComponent } from './home.component'
import { LeftMenuService } from '@sunbird-cb/collection'
import { EMPTY, of } from 'rxjs'

describe('HomeComponent', () => {
    let component: HomeComponent

    // The component pipes off isLtMedium$ in a field initialiser, so it has to be a real
    // observable before the constructor runs.
    const valueSvc: Partial<ValueService> = {
        isXSmall$: of(false),
        isLtMedium$: of(false),
    }
    // The constructor subscribes to router.events; nothing in this smoke test navigates,
    // so an empty stream keeps the NavigationEnd handler out of the way.
    const router: Partial<Router> = { events: EMPTY }
    const activeRoute: Partial<ActivatedRoute> = {}
    const configService: Partial<ConfigurationsService> = {}
    // The constructor subscribes to onMessage() straight away.
    const leftMenuService: Partial<LeftMenuService> = {
        onMessage: () => of(null),
    } as any
    const events: Partial<EventService> = {}

    beforeAll(() => {
        component = new HomeComponent(
            valueSvc as ValueService,
            router as Router,
            activeRoute as ActivatedRoute,
            configService as ConfigurationsService,
            leftMenuService as LeftMenuService,
            events as EventService
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })
})