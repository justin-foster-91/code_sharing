import './App.css';
import React, { useEffect, useState } from 'react';
import { Switch, Route } from "react-router-dom";
import AuthApiService from './Services/auth-api-service';
// import IdleService from './Services/idle-service';
import TokenService from './Services/token-service';
import LoginForm from './Components/LoginForm';
import SignupForm from './Components/SignupForm';
import LandingPage from './Components/LandingPage';
import InstanceIndex from './Components/Dashboard/InstanceIndex';
import { makeStyles } from '@material-ui/core/styles';
import InstanceDetails from './Components/Dashboard/InstanceDetails';
import Dashboard from './Components/Dashboard/Dashboard';
import PublicInstances from './Components/PublicInstances';
import UserProfile from './Components/UserProfile';
import NotFound from './Components/NotFound';
import InstanceApiService from './Services/instance-api-service';
import InstanceActivityZone from './Components/InstanceActivityZone';
import {
  epHome,
  epLogin,
  epSignup,
  epInstanceIndex,
  epInstanceDetails,
  epPublicInstances,
  epUserDetails,
  epFriends,
} from "./fronteps";
import { UserProvider } from './Context/userContext';
require('codemirror/mode/scheme/scheme');

function App() {
  const paper = outerPaper();


  return (
    <UserProvider>
      <div className="App">
        <div>
          <Switch>
            <Route
              exact path={epHome}
              component={() => <LandingPage></LandingPage>}
            />
            <Route
              exact path={'/panel.html'}
              component={() => <LandingPage></LandingPage>}
            />
            <Route
              path={epSignup}
              component={SignupForm}
            />
            <Route
              path={epLogin}
              component={LoginForm}
            />
            <Route
              path={'/instances/:id/views/:view_id'}
              component={(props) => <Dashboard child={<InstanceActivityZone />}></Dashboard>}
            />
            <Route
              path={epInstanceDetails}
              component={(props) => <Dashboard child={<InstanceDetails/>}></Dashboard>}
            />
            <Route
              path={epInstanceIndex}
              component={(props) => <InstanceIndex></InstanceIndex>}
            />
            <Route
              path={epFriends}
              component={(props) => <Dashboard child={<div>Friends Coming Soon</div>}></Dashboard>}
            />
            <Route
              path={epPublicInstances}
              component={(props) => <Dashboard child={<PublicInstances/>}></Dashboard>}
            />
            <Route
              path={epUserDetails}
              component={(props) => <Dashboard child={<UserProfile match={props.match}/>}></Dashboard>}
            />
            <Route
              component={(props) => <Dashboard child={<NotFound/>}></Dashboard>}
            />
          </Switch>
        </div>
      </div>
    </UserProvider>
  );
}

const outerPaper = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(2),
      width: theme.spacing(50),
      height: theme.spacing(50),
    },
  },
}));

export default App;
