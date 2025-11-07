import { Component, input } from '@angular/core';

@Component({
  selector: 'button-control',
  imports: [],
  templateUrl: './button-control.html',
  styleUrl: './button-control.scss',
})
export class ButtonControl {
  button_symbol = input<string>('∅');

  onClick() {
    console.log('Button ' + this.button_symbol() + ' was clicked');
  }
}