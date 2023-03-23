//Sidebar icons/links go here
import React from 'react';
import { useHistory, useParams } from "react-router-dom";
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import PeopleIcon from '@material-ui/icons/People';
import CodeIcon from '@material-ui/icons/Code';
import Divider from '@material-ui/core/Divider';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import PhotoAlbumIcon from '@material-ui/icons/PhotoAlbum';
import TokenService from '../../Services/token-service';
import PersonIcon from '@material-ui/icons/Person';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import ListIcon from '@material-ui/icons/List';
import ViewListIcon from '@material-ui/icons/ViewList';
import useStyles from '../../styles.js';
import {TwitchIcon} from '../../Assets/TwitchIcon.png';

export function PublicListItems(props) {
  const classes = useStyles();
  let history = useHistory();

  const handleClickButton = (path) => {
    if(path === '/login') TokenService.clearAuthToken();
    history.push(path)
  }  

  let path = window.location.pathname

  return (
  <>
    <div>

    <ListItem button onClick={() => handleClickButton('/instances/5/views/video-call')} 
      className={path === '/video-call' ? classes.listIcon : ''}>
      <ListItemIcon>
        <CodeIcon />
      </ListItemIcon>
      <ListItemText primary="Instance VideoChat" />
    </ListItem>

    <ListItem button onClick={() => handleClickButton('/instances')} 
      className={path === '/instances' ? classes.listIcon : ''}>
      <ListItemIcon>
        <ViewListIcon />
      </ListItemIcon>
      <ListItemText primary="My Instances" />
    </ListItem>

    <ListItem button onClick={() => handleClickButton('/friends')}
      className={path === '/friends' ? classes.listIcon : ''}>
      <ListItemIcon>
        <PeopleIcon />
      </ListItemIcon>
      <ListItemText primary="Friends" />
    </ListItem>

    <ListItem button onClick={() => handleClickButton('/gallery')}
      className={path === '/gallery' ? classes.listIcon : ''}>
      <ListItemIcon>
        <PhotoAlbumIcon />
      </ListItemIcon>
      <ListItemText primary="Public Instances" />
    </ListItem>
    </div>
    <Divider />
    <div>
    <ListItem button onClick={() => handleClickButton('/mages/me')}
      className={path.includes('/mages') ? classes.listIcon : ''}>
      <ListItemIcon>
        <AccountCircleIcon />
      </ListItemIcon>
      <ListItemText primary="My Profile" />
    </ListItem>
    {/* Twitch Tab */}
    {/* <ListItem button
      onClick={() => handleClickButton('/wizards/me')}
      >
      <ListItemIcon >
      <img src='https://i.imgur.com/O6pTizo.png' alt="TwitchIcon" width="24px"></img>
      </ListItemIcon>
      <ListItemText primary="Twitch" />
    </ListItem> */}
    <ListItem button onClick={() => handleClickButton('/login')}>
      <ListItemIcon>
        <PowerSettingsNewIcon />
      </ListItemIcon>
      <ListItemText primary="Logout" />
    </ListItem>
    </div>
  </>
  )
};

export function PrivateListItems() {
  const classes = useStyles();
  let history = useHistory();

  const handleClickButton = (path) => {
    history.push(path)
    if(path === '/login') TokenService.clearAuthToken();
  }

  let path = window.location.pathname

  return (
  <>
    <div>
    <ListItem button onClick={() => handleClickButton('/gallery')}
      className={path === '/gallery' ? classes.listIcon : ''}>
      <ListItemIcon>
      <PhotoAlbumIcon />
      </ListItemIcon>
      <ListItemText primary="Public Instances" />
    </ListItem>
    </div>

    <Divider />
    <div>
    <ListItem button onClick={() => history.push('/login')}>
      <ListItemIcon>
      <PersonIcon />
      </ListItemIcon>
      <ListItemText primary="Login" />
    </ListItem>
    <ListItem button onClick={() => history.push('/signup')}>
      <ListItemIcon>
      <PersonAddIcon />
      </ListItemIcon>
      <ListItemText primary="Signup" />
    </ListItem>
    </div>
  </>
  )
}