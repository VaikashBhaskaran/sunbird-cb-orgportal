import { ProfileAvatarComponent } from './profile-avatar.component'

describe('ProfileAvatarComponent', () => {
  let component: ProfileAvatarComponent

  beforeEach(() => {
    component = new ProfileAvatarComponent()

    // Clear all mocks before each test
    jest.clearAllMocks()

    // Mock console.log to prevent test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Component creation', () => {
    it('should create the component with default values', () => {
      expect(component).toBeTruthy()
      expect(component.color).toBe('')
      expect(component.size).toBe('')
      expect(component.showInitials).toBe(false)
      expect(component.randomColor).toBe(false)
    })

    it('should generate a random string for the random property', () => {
      // Mock Math.random to test the random string generation
      const mockRandom = jest.spyOn(Math, 'random')
      mockRandom.mockReturnValue(0.5)

      // Re-initialize the component to trigger the random generation
      component = new ProfileAvatarComponent()

      expect(component.random).toBe('i') // Based on the mocked random value
    })
  })

  describe('ngOnInit method', () => {
    beforeEach(() => {
      // Spy on the createInititals method
      jest.spyOn(component as any, 'createInititals')

      // Mock Math.random and Math.floor for predictable test results
      jest.spyOn(Math, 'random').mockReturnValue(0.3)
      jest.spyOn(Math, 'floor').mockReturnValue(1)
    })

    it('should not show initials when photoUrl starts with http://', () => {
      component.name = 'John Doe'
      component.photoUrl = 'http://example.com/photo.jpg'

      component.ngOnInit()

      expect(component.showInitials).toBe(false)
      expect((component as any).createInititals).not.toHaveBeenCalled()
    })

    it('should not show initials when photoUrl starts with https://', () => {
      component.name = 'John Doe'
      component.photoUrl = 'https://example.com/photo.jpg'

      component.ngOnInit()

      expect(component.showInitials).toBe(false)
      expect((component as any).createInititals).not.toHaveBeenCalled()
    })

    it('should show initials when photoUrl is empty', () => {
      component.name = 'John Doe'
      component.photoUrl = ''

      component.ngOnInit()

      expect(component.showInitials).toBe(true)
      expect((component as any).createInititals).toHaveBeenCalled()
      expect(component.circleColor).toBe('#306933') // Second color in the array with index 1
    })

    it('should show initials when photoUrl is invalid', () => {
      component.name = 'John Doe'
      component.photoUrl = 'file://local/photo.jpg'

      component.ngOnInit()

      expect(component.showInitials).toBe(true)
      expect((component as any).createInititals).toHaveBeenCalled()
    })

    it('should not call createInititals when initials are already provided', () => {
      component.name = 'John Doe'
      component.photoUrl = ''
      component.initials = 'JD'

      component.ngOnInit()

      expect(component.showInitials).toBe(true)
      expect((component as any).createInititals).not.toHaveBeenCalled()
      expect(component.initials).toBe('JD')
    })

    it('should use randomcolors when randomColor is true', () => {
      component.name = 'John Doe'
      component.photoUrl = ''
      component.randomColor = true

      // Mock a different Math.floor return for the second call
      const mockFloor = jest.spyOn(Math, 'floor')
      mockFloor.mockReturnValueOnce(1).mockReturnValueOnce(2)

      component.ngOnInit()

      expect(component.circleColor).toBe('#006400') // Third color in randomcolors array with index 2
    })
  })

  describe('createInititals method', () => {
    it('should normalize whitespace in the name', () => {
      component.name = 'John   Doe';

      (component as any).createInititals()

      expect(component.initials).toBe('JD')
    })

    it('should handle single-letter name', () => {
      component.name = 'J';

      (component as any).createInititals()

      expect(component.initials).toBe('J')
      expect((component as any).randomcolors).toEqual(['#006400'])
    })

    it('should handle single word name with multiple letters', () => {
      component.name = 'John';

      (component as any).createInititals()

      expect(component.initials).toBe('JO')
      expect((component as any).randomcolors).toEqual(['#006400'])
    })

    it('should create initials from first and last name', () => {
      component.name = 'John Doe';

      (component as any).createInititals()

      expect(component.initials).toBe('JD')
    })

    it('should handle names with multiple spaces', () => {
      component.name = ' John  Doe  Smith ';

      (component as any).createInititals()

      expect(component.initials).toBe('JD')
    })

    it('should handle empty name', () => {
      component.name = '';

      (component as any).createInititals()

      expect(component.initials).toBe('')
    })

    it('should convert initials to uppercase', () => {
      component.name = 'john doe';

      (component as any).createInititals()

      expect(component.initials).toBe('JD')
    })


    it('should generate initials from first and last name', () => {
      // This used to assert on a console.log that createInititals no longer makes; the
      // observable outcome is the initials themselves.
      component.name = 'John Doe';

      (component as any).createInititals()

      expect(component.initials).toBe('JD')
    })

    it('should handle fallback case for unusual name formats', () => {
      // Force the array checks to fail to test the fallback case
      component.name = 'John'

      // Mock array methods to force fallback case
      jest.spyOn(String.prototype, 'split').mockReturnValue([]);

      (component as any).createInititals()

      // Should take first two characters from fallback logic
      expect(component.initials).toBe('JO')
    })
  })

  describe('changeToDefaultImg method', () => {
    it('should change the source to the default image path', () => {
      const mockEvent = {
        target: {
          src: 'original-image.jpg'
        }
      }

      component.changeToDefaultImg(mockEvent)

      expect(mockEvent.target.src).toBe('/assets/instances/eagle/app_logos/default.png')
    })
  })
})