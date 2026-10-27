import { Component, EventEmitter, Input, Output } from '@angular/core'
import { UntypedFormGroup } from '@angular/forms'

@Component({
    selector: 'ws-app-custom-input-text',
    templateUrl: './custom-input-text.component.html',
    styleUrls: ['./custom-input-text.component.scss'],
    standalone: false
})
export class CustomInputTextComponent {
  @Input() question: UntypedFormGroup | undefined
  @Input() customForm: UntypedFormGroup | undefined
  @Input() index: UntypedFormGroup | undefined
  @Output() removeRow: EventEmitter<any> = new EventEmitter()
  @Output() customRegex: EventEmitter<any> = new EventEmitter()

  fieldValidationTypes = [
    { key: 'Numbers only', value: "^[0-9]+$" },
    { key: 'Text only', value: "^[A-Za-z\s]+$" },
    { key: 'Alphanumeric', value: "^[A-Za-z0-9\s]+$" },
    { key: 'Email', value: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" },
    { key: 'Phone number', value: "^[6-9]\\d{9}$" },
    { key: 'Regex', value: "regex" }
  ]

  constructor() {
  }

  ngOnInit(): void {
    if (this.question) {
      this.question.get('name')?.valueChanges.subscribe(value => {
        const parameterized = this.createParameterName(value || '')
        const attributeNameControl = this.question?.get('attributeName')
        if (attributeNameControl) {
          attributeNameControl.setValue(parameterized)
        }
      })
    }
  }

  removeItem() {
    this.removeRow.emit(this.index)
  }

  createParameterName(input: string): string {
    return input
      .toLowerCase() //Convert to lowercase
      .replace(/[^a-z0-9\s]/g, '') //Remove special characters
      .replace(/\s+/g, '_') //Replace spaces with underscores
      .replace(/(^_+)|(_+$)/g, '') //Remove leading/trailing underscores
  }



  onFieldValidationChange(event: any) {
    this.customRegex.emit({ selected: event.value, index: this.index })
  }
}
