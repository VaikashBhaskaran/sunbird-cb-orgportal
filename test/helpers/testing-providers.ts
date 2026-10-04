/**
 * Providers that component specs in this repository almost always need.
 *
 * Most specs here are shallow "should create" tests. The component under test rarely
 * injects these services itself - they are pulled in transitively by @sunbird-cb/utils-v2
 * services (EventService -> UtilityService -> ActivatedRoute, and so on), which is why the
 * same handful of NG0201 errors appears across dozens of unrelated specs.
 *
 * Use it as the base of a TestBed's providers and append anything specific afterwards, so
 * the later entry wins:
 *
 *   TestBed.configureTestingModule({
 *     declarations: [MyComponent],
 *     providers: [
 *       ...commonTestingProviders(),
 *       { provide: MyService, useValue: myServiceStub },
 *     ],
 *   })
 *
 * These are deliberately inert stubs. A spec that actually exercises routing, dialogs or
 * translation should provide its own doubles rather than assert against these.
 */
import { DatePipe } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { Pipe, PipeTransform } from '@angular/core'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatMenuModule } from '@angular/material/menu'
import { ActivatedRoute } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { ValueService } from '@sunbird-cb/utils-v2'
import { BehaviorSubject, EMPTY, of } from 'rxjs'

import { LoaderService } from '../../src/app/services/loader.service'

/** An empty ParamMap, matching Angular's interface closely enough for a stub. */
function emptyParamMap(): any {
  return { get: () => null, getAll: () => [], has: () => false, keys: [] }
}

/** A route that resolves nothing: empty params, data and query params. */
export function activatedRouteStub(data: any = {}): any {
  const snapshot = {
    data,
    params: {},
    queryParams: {},
    paramMap: emptyParamMap(),
    queryParamMap: emptyParamMap(),
  }
  return {
    snapshot,
    // Components read these both as observables and off the snapshot. paramMap and
    // queryParamMap exist in both forms too, so they are observables here.
    data: of(data),
    params: of({}),
    queryParams: of({}),
    paramMap: of(emptyParamMap()),
    queryParamMap: of(emptyParamMap()),
    fragment: of(null),
    // Several components walk up to a parent route for resolver data.
    parent: {
      snapshot,
      data: of(data),
      params: of({}),
      queryParams: of({}),
      paramMap: of(emptyParamMap()),
      queryParamMap: of(emptyParamMap()),
    },
  }
}

/**
 * The shape the viewer's resolvers put on the route: components there read
 * `route.data.content.data`, and several reach straight into artifactUrl or subTitles,
 * so those carry empty defaults rather than being absent.
 */
export function viewerRouteData(content: any = {}): any {
  return {
    content: {
      data: {
        identifier: 'test-content',
        name: 'Test Content',
        mimeType: '',
        artifactUrl: '',
        subTitles: [],
        ...content,
      },
    },
  }
}

/**
 * The shape the app's page resolvers put on the route. Components read the page's config
 * straight off `snapshot.data.pageData.data` and the signed-in user off
 * `snapshot.data.configService`, both without guarding, so both carry empty defaults.
 */
export function pageRouteData(pageData: any = {}, configService: any = {}): any {
  return {
    pageData: { data: pageData },
    configService: {
      userProfile: {},
      unMappedUser: { profileDetails: {}, roles: [] },
      ...configService,
    },
  }
}

/** Enough of TranslateService for MultilingualTranslationsService to construct. */
export function translateServiceStub(): any {
  return {
    get: (key: any) => of(key),
    instant: (key: any) => key,
    stream: (key: any) => of(key),
    use: () => of({}),
    setDefaultLang: () => undefined,
    getBrowserLang: () => 'en',
    currentLang: 'en',
    defaultLang: 'en',
    onLangChange: EMPTY,
    onTranslationChange: EMPTY,
    onDefaultLangChange: EMPTY,
  }
}

/** Mirrors LoaderService: a BehaviorSubject plus the observable view of it. */
export function loaderServiceStub(): any {
  const changeLoad = new BehaviorSubject<boolean>(false)
  return {
    changeLoad,
    $currentState: changeLoad.asObservable(),
    changeLoaderState: jest.fn((state: boolean) => changeLoad.next(state)),
  }
}

/**
 * ValueService's two breakpoint observables. The real one derives them from a
 * BreakpointObserver; components read them as fields during construction and pipe off them
 * straight away, so they have to be observables rather than absent.
 */
export function valueServiceStub(): any {
  return {
    isXSmall$: of(false),
    isLtMedium$: of(false),
  }
}

/** A dialog reference that reports an immediate, empty close. */
export function matDialogRefStub(): any {
  return {
    close: jest.fn(),
    afterClosed: () => of(undefined),
    afterOpened: () => of(undefined),
    backdropClick: () => EMPTY,
    keydownEvents: () => EMPTY,
    updateSize: jest.fn(),
    updatePosition: jest.fn(),
  }
}

export interface CommonTestingProvidersOptions {
  /** Value exposed as the ActivatedRoute's `data` and `snapshot.data`. */
  routeData?: any
  /** Value injected for MAT_DIALOG_DATA. */
  dialogData?: any
}

export function commonTestingProviders(options: CommonTestingProvidersOptions = {}): any[] {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    { provide: ActivatedRoute, useValue: activatedRouteStub(options.routeData ?? {}) },
    { provide: TranslateService, useValue: translateServiceStub() },
    { provide: MatDialogRef, useValue: matDialogRefStub() },
    { provide: MAT_DIALOG_DATA, useValue: options.dialogData ?? {} },
    // Injected by EventService and friends; app.module.ts supplies the real value.
    { provide: 'environment', useValue: {} },
    // Widely injected by feature components; the real one is provided in AppModule.
    { provide: LoaderService, useValue: loaderServiceStub() },
    // Read as a field initialiser by layout-aware components, so it cannot be absent.
    { provide: ValueService, useValue: valueServiceStub() },
    // A real DatePipe: it has no dependencies beyond the default LOCALE_ID.
    DatePipe,
  ]
}

/**
 * Pass-through stand-ins for the custom pipes these templates use.
 *
 * NO_ERRORS_SCHEMA silences unknown elements and inputs but not unknown pipes, which fail
 * with NG0302. Declaring these alongside the component under test keeps a shallow smoke
 * test from having to import the real pipe modules and everything they drag in.
 *
 * `standalone: false` is required: Angular pipes default to standalone from v19, and a
 * standalone pipe cannot appear in a TestBed's `declarations`.
 */
@Pipe({ name: 'translate', standalone: false })
export class TranslateStubPipe implements PipeTransform {
  transform(value: any): any { return value }
}

@Pipe({ name: 'pipePartialContent', standalone: false })
export class PartialContentStubPipe implements PipeTransform {
  transform(value: any): any { return value }
}

@Pipe({ name: 'pipeDurationTransform', standalone: false })
export class DurationTransformStubPipe implements PipeTransform {
  transform(value: any): any { return value }
}

@Pipe({ name: 'pipeLimitTo', standalone: false })
export class LimitToStubPipe implements PipeTransform {
  transform(value: any): any { return value }
}

@Pipe({ name: 'pipeSafeSanitizer', standalone: false })
export class SafeSanitizerStubPipe implements PipeTransform {
  transform(value: any): any { return value }
}

@Pipe({ name: 'orderBy', standalone: false })
export class OrderByStubPipe implements PipeTransform {
  transform(value: any): any { return value }
}

@Pipe({ name: 'replaceNbsp', standalone: false })
export class ReplaceNbspStubPipe implements PipeTransform {
  transform(value: any): any { return value }
}

/** Every stub pipe above, for spreading into a TestBed's `declarations`. */
export function stubPipes(): any[] {
  return [
    TranslateStubPipe,
    PartialContentStubPipe,
    DurationTransformStubPipe,
    LimitToStubPipe,
    SafeSanitizerStubPipe,
    ReplaceNbspStubPipe,
    OrderByStubPipe,
  ]
}

/**
 * Material modules whose directives are referenced by template variables, for example
 * `#menu="matMenu"` or `#auto="matAutocomplete"`.
 *
 * NO_ERRORS_SCHEMA cannot cover these: an unresolved export name fails with NG0301
 * regardless of schema, so the real module has to be imported.
 */
export function commonMaterialModules(): any[] {
  return [MatMenuModule, MatAutocompleteModule]
}
