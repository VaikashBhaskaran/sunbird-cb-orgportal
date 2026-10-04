import { ItemTileComponent } from './item-tile.component'

// Mock the dependencies
const mockActivatedRoute = {
    parent: {
        snapshot: {},
    },
}

const mockRouter = {
    navigate: jest.fn(),
}

describe('ItemTileComponent', () => {
    let component: ItemTileComponent

    beforeEach(() => {
        component = new ItemTileComponent(mockActivatedRoute as any, mockRouter as any)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should return true for isString if input is a string', () => {
        const result = component.isString('test')
        expect(result).toBe(true)
    })

    it('should return false for isString if input is not a string', () => {
        const result = component.isString(123)
        expect(result).toBe(false)
    })

    it('should call router.navigate on goToView with correct arguments', () => {
        // Setup input data
        component.data = {
            category: 'cat1',
            itemId: '123',
            source: 'source1',
        }

        component.goToView()

        expect(mockRouter.navigate).toHaveBeenCalledWith(
            ['/app/igot/khub/view/cat1/123/source1'],
            { relativeTo: mockActivatedRoute.parent }
        )
    })

    it('should throw an error when goToView encounters an exception', () => {
        // The URL is built from this input before navigate is reached, so it has to be
        // bound or the failure under test never gets a chance to happen.
        component.data = {
            category: 'cat1',
            itemId: '123',
            source: 'source1',
        }

        // Force an error in the navigate method
        mockRouter.navigate.mockImplementationOnce(() => {
            throw new Error('Test error')
        })

        expect(() => component.goToView()).toThrowError('Test error')
    })
})
