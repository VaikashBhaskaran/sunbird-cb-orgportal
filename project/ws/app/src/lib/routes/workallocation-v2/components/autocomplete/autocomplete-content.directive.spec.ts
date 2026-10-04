import { AutocompleteContentDirective } from './autocomplete-content.directive'

describe('AutocompleteContentDirective', () => {
  it('should create an instance', () => {
    const directive = new AutocompleteContentDirective({} as any)   // TemplateRef, only held as a field
    expect(directive).toBeTruthy()
  })
})
