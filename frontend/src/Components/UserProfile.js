import React, { useEffect, useState } from 'react';
import Title from './Dashboard/Title';
import InstanceApiService from '../Services/instance-api-service';
import UserInstances from './UserInstances';
import Pagination from '@material-ui/lab/Pagination';
import {SearchBar} from '../Util.js'
import useStyles from '../styles.js';

const UserProfile = (props) => {
  const classes = useStyles();
  const [user, setUser] = useState(undefined)
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = React.useState('');

  let path = window.location.pathname

  useEffect(() => {
    let isMounted = true
    const { id } = props.match.params

    InstanceApiService.getUserById(id, currentPage, search)
      .then(user => {
        if(isMounted) setUser(user)
      })
      return () => {
        isMounted = false
      }
  },[currentPage, search, path])

  return (
    user ?
      <>
        <div className={classes.userProfileHeadBar}>
          <div className={classes.userProfileHeadLeft}></div>
          <div className={classes.userProfileHeadTitle}>{`Instances of ${user.username}`}</div>
          <div className={classes.userProfileHeadRight}><SearchBar setSearch={setSearch}/></div>
        </div>

        <UserInstances instances={user.instances}/>
        
        <div className={classes.userProfileRoot}>
          <Pagination count={Math.ceil(user.total / rowsPerPage)}
            onChange={(event, page) => {setCurrentPage(page)}}
          />
        </div>
      </>
    : ''
  );
};

export default UserProfile;
