//Headers and sort for list of instances
import React, { useEffect } from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import PropTypes from 'prop-types';

const headCells = [
  { id: 'Created', numeric: false, disablePadding: true, label: 'Created' },
  { id: 'Modified', numeric: false, disablePadding: true, label: 'Modified' },
  { id: 'Name', numeric: false, disablePadding: true, label: 'Name' },
  { id: 'Description', numeric: false, disablePadding: false, label: 'Description' },
  { id: 'Tags', numeric: false, disablePadding: false, label: 'Tags' },
  { id: 'Code', numeric: false, disablePadding: true, label: 'Code' },
  { id: 'Edit', numeric: false, disablePadding: true, label: 'Edit'},
  { id: 'Public', numeric: false, disablePadding: true, label: 'Public'},
];

export function InstanceTableHeader(props) {
  const { classes, onSelectAllClick, sortDirection, orderBy, numSelected, onRequestSort, instances, instancesPerPage } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < instancesPerPage}
            checked={instances.length > 0 && numSelected === Math.min(instances.length, instancesPerPage)}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all desserts' }}
          />
          
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'default'}
            sortDirection={orderBy === headCell.id ? sortDirection : false}
          >
            {headCell.id !== 'Tags' && headCell.id !== 'Code' && headCell.id !== 'Edit' ?
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? sortDirection : 'asc'}
              onClick={createSortHandler(headCell.id)}
              >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </TableSortLabel>
            : headCell.id}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

InstanceTableHeader.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
};