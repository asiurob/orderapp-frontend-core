import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from 'src/app/shared/header/header';
import { Sidebar } from 'src/app/shared/sidebar/sidebar';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';


@Component({
  selector: 'ord-core-main-layout',
  imports: [RouterOutlet, Header, Sidebar, LoaderComponent],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss'],
  standalone: true, 
})
export class MainLayout {

}
