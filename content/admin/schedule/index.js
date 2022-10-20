console.log('start')

$table = $('#main-table')

$table.bootstrapTable({
    search: true,
    striped: true,
    toolbar: '#bootstrapTableToolbar',
    classes: 'table table-hover table-fixed',
    url: '/.netlify/functions/admin-schedule',
    columns: [
        {
          field: 'id',
          title: 'ID',
          sortable: true,
        }, {
          field: 'name',
          title: 'Name',
          sortable: true,
        }, {
          field: 'email',
          title: 'Email',
          sortable: true,
        },
      ],
    // pagination: true,
    // sidePagination: 'server',
});

console.log('end')