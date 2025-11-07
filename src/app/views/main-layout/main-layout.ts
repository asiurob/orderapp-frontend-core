import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from 'src/app/shared/header/header';
import { Sidebar } from 'src/app/shared/sidebar/sidebar';


@Component({
  selector: 'ord-core-main-layout',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss'],
  standalone: true, 
})
export class MainLayout {

}
