import { Component, Input } from '@angular/core'

@Component({
    selector: 'ws-app-profile-avatar',
    templateUrl: './profile-avatar.component.html',
    styleUrls: ['./profile-avatar.component.scss'],
    standalone: false
})
export class ProfileAvatarComponent {

  @Input()
  public photoUrl!: string
  @Input() color = ''
  @Input()
  public name!: string
  @Input() public size = ''
  random = Math.random().toString(36).slice(2)
  public showInitials = false
  public circleColor!: string
  @Input() initials?: string
  @Input() datalen: any
  @Input() randomColor = false

  private colors = [
    '#EB7181', // red
    '#306933', // green
    '#000000', // black
    '#3670B2', // blue
    '#4E9E87',
    '#7E4C8D',
  ]

  private randomcolors = [
    '#EB7181', // red
    '#006400', // green
    '#000000', // black
    '#3670B2', // blue
    '#4E9E87',
    '#7E4C8D',
  ]

  ngOnInit() {
    if (!this.photoUrl || !(this.photoUrl.startsWith('http://') || this.photoUrl.startsWith('https://'))) {
      this.showInitials = true
      if (!this.initials) {
        this.createInititals()
      }
      // this.name = 'N '
      // console.log((this.name).trim().length, "(this.name).trim().length====")
      // if ((this.name).trim().length === 1) {
      //   this.randomcolors = [
      //     '#006400', // green
      //   ]
      // }
      const randomIndex = Math.floor(Math.random() * Math.floor(this.colors.length))
      this.circleColor = this.colors[randomIndex]
      if (this.randomColor) {
        const randomIndex1 = Math.floor(Math.random() * Math.floor(this.randomcolors.length))
        this.circleColor = this.randomcolors[randomIndex1]
      }
    }
  }

  private createInititals(): void {
    let initials = ''
    let userName = `${this.name} `.trim()
    userName = userName.replace(/\s+/g, ' ')
    // const array = `${this.name} `.trim().toString().split(' ')
    const array = userName.trim().toString().split(' ')
    // const array = userName.trim().toString().split(' ')
    // if (array && array.length === 1 && typeof array[0] !== 'undefined') {
    //   if (array[0].length === 1) {
    //     initials += array[0].charAt(0)
    //     this.randomcolors = [
    //       '#006400', // green
    //     ]
    //   }
    //   if (array[0].length > 1) {
    //     initials += array[0].charAt(0)
    //     initials += array[0].charAt(1)
    //     this.randomcolors = [
    //       '#006400', // green
    //     ]
    //   }

    //   // console.log(initials, "initials==========")
    //   // console.log(this.randomcolors, "randomcolors========")
    // }
    // if (array && array.length >= 2 && typeof array[0] !== 'undefined' && typeof array[1] !== 'undefined') {
    //   initials += array[0].charAt(0)
    //   initials += array[1].charAt(0)
    // } else {
    if (array && array.length === 1 && typeof array[0] !== 'undefined') {
      if (array[0].length === 1) {
        initials += array[0].charAt(0)
        this.randomcolors = ['#006400'] // green
      } else if (array[0].length > 1) {
        initials += array[0].charAt(0)
        initials += array[0].charAt(1)
        this.randomcolors = ['#006400'] // green
      }
    } else if (array && array.length >= 2 && typeof array[0] !== 'undefined' && typeof array[1] !== 'undefined') {
      initials += array[0].charAt(0)
      initials += array[1].charAt(0)
    } else {
      for (let i = 0; i < this.name.length; i += 1) {
        if (this.name.charAt(i) === ' ') {
          continue
        }

        initials += this.name.charAt(i)

        if (initials.length === 2) {
          break
        }
      }
    }
    this.initials = initials.toUpperCase()
  }

  changeToDefaultImg($event: any) {
    $event.target.src = '/assets/instances/eagle/app_logos/default.png'
  }
}
