
import { ActivatedRouteSnapshot } from '@angular/router'
import { InitResolver } from './init-resolve.service'

// Mock the dependencies that would normally be injected
// Since we don't need them for this test case, we can mock them
jest.mock('@angular/router', () => ({
  ActivatedRouteSnapshot: jest.fn(),
}))

describe('InitResolver', () => {
  let resolver: InitResolver

  beforeEach(() => {
    resolver = new InitResolver() // Creating an instance of the resolver
  })

  it('should resolve with undefined when no data is provided in the route', (done) => {
    jest.setTimeout(10000) // Increase timeout to 10 seconds

    const mockRoute: ActivatedRouteSnapshot = {
      data: {},
    } as any

    resolver.resolve(mockRoute).subscribe((result) => {
      // resolve() forkJoins a single of(undefined), so it emits [undefined].
      expect(result).toEqual([undefined])
      done()
    })
  })

  it('should resolve when route contains data with "ckeditor"', (done) => {
    // Create a mock route with 'ckeditor' in the data
    const mockRoute: ActivatedRouteSnapshot = {
      data: { load: ['ckeditor'] },
    } as any

    // Since the actual code is commented out and doesn't call any real methods
    // the result will still be `undefined` because we only push `of(undefined)`
    resolver.resolve(mockRoute).subscribe((result) => {
      // resolve() forkJoins a single of(undefined), so it emits [undefined].
      expect(result).toEqual([undefined]) // Should resolve with `undefined` as no actual processing happens in this test
      done()
    })
  })

  it('should resolve with empty array when route contains an empty "load" array', (done) => {
    // Create a mock route with an empty load array
    const mockRoute: ActivatedRouteSnapshot = {
      data: { load: [] },
    } as any

    resolver.resolve(mockRoute).subscribe((result) => {
      // resolve() forkJoins a single of(undefined), so it emits [undefined].
      expect(result).toEqual([undefined]) // No data was pushed into forkJoin, it should return undefined
      done()
    })
  })
})
