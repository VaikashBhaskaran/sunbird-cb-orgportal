import { Pipe, PipeTransform } from '@angular/core'
import { orderBy } from 'lodash'

@Pipe({
    name: 'acsendingOrder',
    standalone: false
})
export class AcsendingOrderPipe implements PipeTransform {

  transform(value: any[], order: any = '', column: string = ''): any[] {
    if (!value || order === '' || !order) { return value } // no array
    if (!column || column === '') {
      // const sorted = this.sortOnCaseSensitivity(value, caseInsensitive)
      if (order === 'asc') { return value.sort((a, b) => `${a}`.localeCompare(`${b}`)) }
      return value.sort((a, b) => `${b}`.localeCompare(`${a}`))
    } // sort 1d array
    if (value.length <= 1) { return value } // array with only one item
    return orderBy(value, [column], [order])
  }

}
