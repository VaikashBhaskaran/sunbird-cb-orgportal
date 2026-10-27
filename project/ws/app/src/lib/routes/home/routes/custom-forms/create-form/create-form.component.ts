import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { FormArray, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms'
import { preventHtmlAndJs } from '../../../../validators/prevent-html-and-js.validator'
import { FileService } from '../../../../users/services/upload.service'
import { Subject } from 'rxjs'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import * as _ from 'lodash'
import { CustomFieldsService } from '../../../../users/custom-fields.service'

@Component({
    selector: 'ws-app-create-form',
    templateUrl: './create-form.component.html',
    styleUrls: ['./create-form.component.scss'],
    standalone: false
})

export class CreateFormComponent implements OnInit {

  sections = [
    {
      icon: 'add',
      title: 'Input Text',
      subTitle: 'Add fields in profile',
      type: 'text',
    },
    {
      icon: 'dashboard',
      title: 'List',
      subTitle: 'Add fields in profile',
      type: 'masterList',
    },
  ]

  fieldValidationTypes = [
    { key: 'Numbers only', value: "^[0-9]+$" },
    { key: 'Text only', value: "^[A-Za-z\s]+$" },
    { key: 'Alphanumeric', value: "^[A-Za-z0-9\s]+$" },
    { key: 'Email', value: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" },
    { key: 'Phone number', value: "^[6-9]\\d{9}$" },
    { key: 'Regex', value: "regex" }
  ]

  @Input() customFieldId: any
  @Input() customFieldObject: any
  customForm!: UntypedFormGroup
  selectedTab: string = ''
  @Output() closeForm: EventEmitter<any> = new EventEmitter()
  public fileName: any
  fileSelected!: File
  private destroySubject$ = new Subject()
  rootOrgId: any
  isLoading: boolean = false
  isEditMode: boolean = false
  constructor(private formBuilder: UntypedFormBuilder, private fileService: FileService,
    private matSnackBar: MatSnackBar, private activeRoute: ActivatedRoute, private customFieldsService: CustomFieldsService
  ) {
    this.rootOrgId = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')
  }

  ngOnInit() {
    this.createForm()
    this.isEditMode = this.customFieldObject ? true : false
  }

  createForm() {
    this.customForm = this.formBuilder.group({
      description: ['', [Validators.required, this.noWhitespaceValidator, preventHtmlAndJs()]],
      questions: this.formBuilder.array([]),
      type: [''],
    })
    if (this.customFieldObject) {
      this.addContent(this.customFieldObject.type)
    }
  }

  noWhitespaceValidator(control: any) {
    const isWhitespace = (control && control.value && control.value.toString() || '').trim().length === 0
    const isValid = !isWhitespace
    return isValid ? null : { whitespace: true }
  }

  addContent(type: string) {
    this.selectedTab = type
    const questionsArray = this.customForm.get('questions')
    if (questionsArray && questionsArray instanceof FormArray) {
      questionsArray.clear()
    }
    if (type === 'text') {
      this.addQuestion(type)
    } else if (type === 'masterList') {
      this.addMasterListQuestion(type)
    }
  }

  addMasterListQuestion(type: string) {
    this.customForm.controls['type'].setValue(type)
    if (this.customFieldObject) {
      this.customFieldsService.readCustomField(this.customFieldObject.customFieldId).subscribe((res: any) => {
        if (res.result) {
          this.customForm.controls['description'].setValue(res.result.description)
          this.customForm.controls['type'].setValue(res.result.type)
          this.appendListWithData(res)
        } else {
          this.appendListQuestion()
        }
      })
    } else {
      this.appendListQuestion()
    }

  }

  appendListWithData(res: any) {
    const questionGroup = this.formBuilder.group({
      name: [res.result.name, [Validators.required, this.forbiddenCharacterValidator, preventHtmlAndJs()]],
      attributeName: [res.result.attributeName, [Validators.required]],
      isMandatory: [res.result.isMandatory],
      isEnabled: [res.result.isEnabled]
    })
    this.getQuestions.push(questionGroup)
    res.result.originalCustomFieldData.forEach((element: any) => {
      const questionGroup = this.formBuilder.group({
        name: [element.name, [Validators.required, this.forbiddenCharacterValidator, preventHtmlAndJs()]],
        attributeName: [element.attributeName, [Validators.required]],
        isMandatory: [false],
        isEnabled: [false]
      })
      this.getQuestions.push(questionGroup)
    })
  }

  appendListQuestion() {
    const questionGroup = this.formBuilder.group({
      name: ['', [Validators.required, this.forbiddenCharacterValidator, preventHtmlAndJs()]],
      attributeName: ['', [Validators.required]],
      isMandatory: [false],
      isEnabled: [false]
    })
    this.getQuestions.push(questionGroup)
  }

  addNewListQuestion() {
    if (this.getQuestions.length > 5) {
      this.matSnackBar.open('Maximum 5 questions can be added')
    } else {
      const questionGroup = this.formBuilder.group({
        name: ['', [Validators.required, this.forbiddenCharacterValidator, preventHtmlAndJs()]],
        attributeName: ['', [Validators.required]],
        isMandatory: [false],
        isEnabled: [false]
      })
      this.getQuestions.push(questionGroup)
    }
  }



  forbiddenCharacterValidator(control: any) {
    const forbiddenPattern = /<[^>]*>|(function[^\s]+)|(javascript:[^\s]+)|([/.]{2,})|(\\+)/i
    const forbidden = forbiddenPattern.test(control.value)
    return forbidden ? { invalidCharacter: true } : null
  }

  get getQuestions(): UntypedFormArray {
    if (this.customForm) {
      const res = this.customForm.controls.questions as UntypedFormArray
      return res
    }
    return this.formBuilder.array([])
  }

  addQuestion(type: string) {
    this.customForm.controls['type'].setValue(type)
    if (this.customFieldObject) {
      this.customFieldsService.readCustomField(this.customFieldObject.customFieldId).subscribe((res: any) => {
        if (res.result) {
          this.customForm.controls['description'].setValue(res.result.description)
          this.customForm.controls['type'].setValue(res.result.type)
          this.appendQuestionWithData(res)
        } else {
          this.appendQuestion()
        }
      })
    } else {
      if (type === 'text') {
        this.appendQuestion()
      } else if (type === 'masterList') {
        if (this.getQuestions.length > 5) {
          this.matSnackBar.open('Maximum 5 questions can be added')
        } else {
          this.addMasterListQuestion(type)
        }
      }
    }
  }



  appendQuestionWithData(res: any) {
    let validationType = 'regex'
    if (this.fieldValidationTypes.find((item: any) => item.value === res.result.validation)) {
      validationType = res.result.validation
    }
    const questionGroup = this.formBuilder.group({
      name: [res.result.name, [Validators.required, this.forbiddenCharacterValidator, preventHtmlAndJs()]],
      attributeName: [res.result.attributeName, [Validators.required]],
      validation: [validationType, [Validators.required]],
      customValidation: [validationType === 'regex' ? res.result.validation : ''],
      isMandatory: [res.result.isMandatory],
      isEnabled: [res.result.isEnabled],
      attributeMaxLength: [res.result.attributeMaxLength ? res.result.attributeMaxLength : '']
    })
    this.getQuestions.push(questionGroup)
  }

  validateForm() {
    if (this.customForm.controls['type'].value === 'masterList') {
      return this.customForm.invalid || this.getQuestions.length < 2 || this.fileSelected === undefined
    }
    return false
  }

  appendQuestion() {
    const questionGroup = this.formBuilder.group({
      name: ['', [Validators.required, this.forbiddenCharacterValidator, preventHtmlAndJs()]],
      attributeName: ['', [Validators.required]],
      validation: ['', [Validators.required]],
      customValidation: [''],
      isMandatory: [false],
      isEnabled: [false],
      attributeMaxLength: ['']
    })
    this.getQuestions.push(questionGroup)
  }

  onSave() {
    let payload: any
    if (this.customForm.value.type === 'text') {
      payload = this.constructPayload()
      this.isLoading = true
      this.customFieldsService.createField(payload).subscribe((res: any) => {
        console.log(res)
        if (res.result) {
          this.matSnackBar.open('Field is created successfully!')
          this.closeForm.emit(true)
        }
        this.isLoading = false
      }, error => {
        this.isLoading = false
        this.matSnackBar.open(error)
        console.log(error)
      })
    } else if (this.customForm.value.type === 'masterList') {
      payload = this.constructPayloadForList()
      this.isLoading = true
      this.customFieldsService.createList(payload).subscribe((res: any) => {
        console.log(res)
        if (res.result) {
          this.matSnackBar.open('List is created successfully!')
          this.closeForm.emit(true)
        }
        this.isLoading = false
      }, error => {
        this.isLoading = false
        this.matSnackBar.open(error.error.params.err)
        console.log(error.error.params.err)
      })
    }

  }

  constructPayloadForList() {
    let customFieldData: any = []
    this.customForm.value.questions.map((question: any, index: number) => {
      if (index !== 0) {
        customFieldData.push({
          name: question.name,
          attributeName: question.attributeName,
          level: index
        })
      }
    })
    const formData: FormData = new FormData()
    let metaTag: any = {
      name: this.customForm.value.questions[0].name,
      description: this.customForm.value.description,
      type: this.customForm.value.type,
      organisationId: this.rootOrgId,
      attributeName: this.customForm.value.questions[0].attributeName,
      isMandatory: this.customForm.value.questions[0].isMandatory,
      isEnabled: this.customForm.value.questions[0].isEnabled,
      customFieldData: customFieldData // This is already an array/object, no need to stringify
    }
    if (this.customFieldObject && this.customFieldObject.customFieldId) {
      metaTag['customFieldId'] = this.customFieldObject.customFieldId
    }
    formData.append('metadata', JSON.stringify(metaTag))
    if (this.fileSelected) {
      formData.append('file', this.fileSelected)
    }
    return formData
  }

  onUpdate() {
    let payload: any
    if (this.customForm.value.type === 'text') {
      payload = this.constructPayload()
      payload['customFieldId'] = this.customFieldObject.customFieldId
      this.isLoading = true
      this.customFieldsService.updateCustomField(payload).subscribe((res: any) => {
        console.log(res)
        if (res.result) {
          this.matSnackBar.open('Field is updated successfully!')
          this.closeForm.emit(true)
        }
        this.isLoading = false
      }, error => {
        this.isLoading = false
        this.matSnackBar.open(error)
        console.log(error)
      })
    } else if (this.customForm.value.type === 'masterList') {
      payload = this.constructPayloadForList()
      this.isLoading = false
      this.customFieldsService.updateList(payload).subscribe((res: any) => {
        console.log(res)
        if (res.result) {
          this.matSnackBar.open('List is updated successfully!')
          this.closeForm.emit(true)
        }
        this.isLoading = false
      }, error => {
        this.isLoading = false
        this.matSnackBar.open(error.error.params.err)
        console.log(error.error.params.err)
      })
    }
  }

  constructPayload() {
    let obj: any = {
      name: this.customForm.value.questions[0].name,
      description: this.customForm.value.description,
      type: this.customForm.value.type,
      organisationId: this.rootOrgId,
      attributeName: this.customForm.value.questions[0].attributeName,
      validation: this.customForm.value.questions[0].validation === 'regex' ? this.customForm.value.questions[0].customValidation : this.customForm.value.questions[0].validation,
      isMandatory: this.customForm.value.questions[0].isMandatory,
      isEnabled: this.customForm.value.questions[0].isEnabled,
    }
    if (this.customForm.value.questions[0].attributeMaxLength && this.customForm.value.questions[0].attributeMaxLength > 0) {
      obj['attributeMaxLength'] = this.customForm.value.questions[0].attributeMaxLength
    }
    return obj
  }

  removeItem(index: number) {
    this.getQuestions.removeAt(index)
  }

  close() {
    this.closeForm.emit(false)
  }
  customRegex(event: any) {
    const question = this.getQuestions.at(event.index) as UntypedFormGroup
    const customValidation = question?.controls['customValidation']
    if (event.selected === 'regex') {
      if (customValidation) {
        customValidation.setValidators([Validators.required])
        customValidation.updateValueAndValidity()
      }
    } else {
      if (customValidation) {
        customValidation.clearValidators()
        customValidation.setValue('')
        customValidation.updateValueAndValidity()
      }
    }
  }

  handleFileClick(event: any): void {
    event.target.value = ''
  }

  handleOnFileChange(event: any): void {
    const fileList = (<HTMLInputElement>event.target).files
    if (fileList && fileList.length > 0) {
      const file: File = fileList[0]
      this.fileName = file.name
      this.fileSelected = file
      if (this.fileService.validateXlFile(this.fileName)) {
        if (this.fileSelected) {
          const input = event.target as HTMLInputElement
          if (input.files?.length) {
            this.fileSelected = input.files[0]
          }
          this.matSnackBar.open('File uploaded successfully!')
          console.log('File selected:', this.fileSelected)
        }
      } else {
        console.log('invalid file')
      }
    }
  }

  /**
   * Constructs unique question groups from hierarchical field data with dynamic levels
   * @param fieldData Hierarchical field data containing states, zones, universities, etc.
   */
  constructNestedQuestions(fieldData: any[]): void {
    // Don't clear existing questions - we'll add the first question in appendListWithData
    // Extract the first question which should already be added
    const firstQuestion = this.getQuestions.at(0)?.value

    if (!fieldData || !Array.isArray(fieldData) || fieldData.length === 0) {
      return
    }

    // Use a Map to store unique field definitions by attributeName
    const uniqueFields = new Map<string, { name: string, attributeName: string }>()

    // Recursive function to extract unique fields from the hierarchy
    const processFields = (items: any[]): void => {
      if (!items || !Array.isArray(items)) return

      items.forEach(item => {
        // Skip processing the root level field that's already added
        if (firstQuestion && item.fieldAttribute === firstQuestion.attributeName) {
          // Skip this field as it's already added
        }
        // Process this field if it's unique by attributeName
        else if (item.fieldName && item.fieldAttribute && !uniqueFields.has(item.fieldAttribute)) {
          uniqueFields.set(item.fieldAttribute, {
            name: item.fieldName,
            attributeName: item.fieldAttribute
          })
        }

        // Recursively process child fields if any
        if (item.fieldValues && Array.isArray(item.fieldValues) && item.fieldValues.length > 0) {
          processFields(item.fieldValues)
        }
      })
    }

    // Start processing from the top level
    processFields(fieldData)

    // Add form groups for each unique field (excluding the first one already added)
    uniqueFields.forEach((field) => {
      const questionGroup = this.formBuilder.group({
        name: [field.name, [Validators.required, this.forbiddenCharacterValidator, preventHtmlAndJs()]],
        attributeName: [field.attributeName, [Validators.required]],
        isMandatory: [false],
        isEnabled: [false]
      })
      this.getQuestions.push(questionGroup)
    })
  }

  ngOnDestroy(): void {
    this.destroySubject$.unsubscribe()
  }
}
