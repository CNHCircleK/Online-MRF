"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var home_1 = require("./home");
var cerfs_1 = require("./cerfs");
//import { angularProfileCard } from '../../components/main-profile/index';
var no_content_1 = require("./no-content");
var ROUTES = [
    { path: '', component: home_1.HomeComponent },
    // { path: 'posts', loadChildren: './posts#PostsModule' },
    // { path: 'profile', component: ProfileComponent },
    // { path: 'react', component: ReactComponent },
    { path: 'cerfs', component: cerfs_1.CerfNavComponent },
    { path: '**', component: no_content_1.NoContentComponent }
];
//# sourceMappingURL=app.routes.js.map