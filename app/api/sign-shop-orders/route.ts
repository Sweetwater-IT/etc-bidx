import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const ascending = searchParams.get('ascending') === 'true';
    const counts = searchParams.get('counts') === 'true';
    const branch = searchParams.get('branch');
    const filtersJson = searchParams.get('filters');
    const statusParam = searchParams.get('status');

    // Handle archived parameter like in active-bids
    const archived = searchParams.get('archived');
    const isArchivedFilter = archived === 'true';
    const excludeArchived = archived === 'false';

    // Parse filters if present
    const filters = filtersJson ? JSON.parse(filtersJson) : {};

    // If we're just getting counts
    if (counts) {
      // For shop_status-based segments
      const shopStatuses = ["not-started", "in-process", "on-order", "complete"];
      // If archived filter is active, return only archived count
      if (isArchivedFilter) {
        // Count all archived sign orders
        const { count: archivedCount, error: archivedError } = await supabase
          .from('sign_orders')
          .select('*', { count: 'exact', head: true })
          .eq('archived', true);
        if (archivedError) {
          return NextResponse.json({ success: false, error: 'Failed to get archived count' }, { status: 500 });
        }
        return NextResponse.json({ success: true, counts: { archived: archivedCount || 0 } });
      }
      const countsResult: Record<string, number> = {
        all: 0,
        "not-started": 0,
        "in-process": 0,
        "on-order": 0,
        complete: 0,
      };

      // Build base count query (not archived)
      let baseQuery = supabase
        .from('sign_orders')
        .select('*', { count: 'exact', head: true })
        .or('archived.is.null,archived.eq.false');

      // Add status filter if present (for load-sheet compatibility)
      const statusValues: string[] = [];
      if (statusParam && statusParam.includes('Draft')) {
        const statuses = statusParam.split(',').map(s => s.trim());
        statuses.forEach(status => {
          statusValues.push(status, status.toLowerCase(), status.toUpperCase());
        });
        baseQuery = baseQuery.in('status', statusValues);
      }

      // Get total count (all)
      const { count: allCount, error: allCountError } = await baseQuery;
      if (allCountError) {
        return NextResponse.json({ success: false, error: 'Failed to get counts' }, { status: 500 });
      }
      countsResult.all = allCount || 0;

      // Get count for each shop_status
      for (const status of shopStatuses) {
        let statusQuery = supabase
          .from('sign_orders')
          .select('*', { count: 'exact', head: true })
          .or('archived.is.null,archived.eq.false')
          .eq('shop_status', status);
        if (statusValues.length > 0) {
          statusQuery = statusQuery.in('status', statusValues);
        }
        const { count: statusCount, error: statusError } = await statusQuery;
        if (!statusError) {
          countsResult[status] = statusCount || 0;
        }
      }
      return NextResponse.json({ success: true, counts: countsResult });
    }

    // Get reference data for joins
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('name, branch_id');
      
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name');
      
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select('id, display_name');

    if (usersError || branchesError || contractorsError) {
      console.error('Error fetching reference data:', { usersError, branchesError, contractorsError });
      return NextResponse.json({ success: false, error: 'Failed to fetch reference data' }, { status: 500 });
    }

    // Create lookup maps
    const userBranchMap = (users || []).reduce((map: any, user: any) => {
      map[user.name] = user.branch_id;
      return map;
    }, {});

    const branchNameMap = (branches || []).reduce((map: any, branch: any) => {
      map[branch.id] = branch.name;
      return map;
    }, {});

    const contractorNameMap = (contractors || []).reduce((map: any, contractor: any) => {
      map[contractor.id] = contractor.display_name;
      return map;
    }, {});

    // Build the main query for sign orders
    let query = supabase
      .from('sign_orders')
      .select(`
        id,
        requestor,
        contractor_id,
        job_number,
        contract_number,
        order_date,
        need_date,
        sale,
        rental,
        perm_signs,
        status,
        shop_status,
        order_number,
        archived,
        assigned_to,
        created_at
      `);
    
    // Apply archived filtering first (like in active-bids)
    if (isArchivedFilter) {
      query = query.eq('archived', true);
    } else if (excludeArchived || (!isArchivedFilter && !statusParam?.includes('Draft'))) {
      // For sign-shop-orders page, exclude archived by default unless specifically requesting archived
      query = query.or('archived.is.null,archived.eq.false');
    }
    
    // Check if we're coming from the load-sheet page which needs both Draft and Submitted
    // The load-sheet page sends status=Draft,Submitted in the request
    if (statusParam && statusParam.includes('Draft')) {
      // Handle multiple statuses separated by commas for the load-sheet page
      const statuses = statusParam.split(',').map(s => s.trim());
      
      // Create an array with all case variations for each status
      const statusValues: string[] = [];
      statuses.forEach(status => {
        statusValues.push(status, status.toLowerCase(), status.toUpperCase());
      });
      
      query = query.in('status', statusValues);
    }

    // Apply branch filter if present
    if (branch && branch !== 'all') {
      if (branch === 'archived') {
        // If branch=archived is passed, override the archived filter
        query = supabase
          .from('sign_orders')
          .select(`
            id,
            requestor,
            contractor_id,
            job_number,
            contract_number,
            order_date,
            need_date,
            sale,
            rental,
            perm_signs,
            status,
            shop_status,
            order_number,
            archived,
            assigned_to,
            created_at
          `)
          .eq('archived', true);
      } else {
        // Map branch names to IDs (correct mapping)
        const branchNameToIdMap: Record<string, number> = {
          'turbotville': 1,
          'hatfield': 2,
          'bedford': 3
        };
        
        // Get branch ID from name (case insensitive)
        const branchId = branchNameToIdMap[branch.toLowerCase()];
        
        if (branchId !== undefined) {
          // Get users from this branch
          const branchUsers = (users || []).filter(user => user.branch_id === branchId);
          const userNames = branchUsers.map(user => user.name);
          
          if (userNames.length > 0) {
            query = query.in('requestor', userNames);
          }
        }
      }
    }

    // Apply filters from the query params
    if (filters && Object.keys(filters).length > 0) {
      for (const [field, values] of Object.entries(filters)) {
        if (values && Array.isArray(values) && values.length > 0) {
          switch (field) {
            case 'customer':
              // Get contractor IDs that match the display names
              const contractorIds = (contractors || [])
                .filter(contractor => values.includes(contractor.display_name))
                .map(contractor => contractor.id);
              if (contractorIds.length > 0) {
                query = query.in('contractor_id', contractorIds);
              }
              break;
            case 'requestor':
              query = query.in('requestor', values);
              break;
            case 'branch':
              // Map branch names to IDs for filtering
              const branchNameToIdMap: Record<string, number> = {
                'hatfield': 2,
                'turbotville': 1,
                'bedford': 3
              };
              const branchIds = values.map(name => branchNameToIdMap[name.toLowerCase()]).filter(id => id !== undefined);
              if (branchIds.length > 0) {
                // Get users from these branches
                const branchUsers = (users || []).filter(user => branchIds.includes(user.branch_id));
                const userNames = branchUsers.map(user => user.name);
                if (userNames.length > 0) {
                  query = query.in('requestor', userNames);
                }
              }
              break;
            case 'job_number':
              query = query.in('job_number', values);
              break;
            case 'contract_number':
              query = query.in('contract_number', values);
              break;
            case 'shop_status':
              // Handle shop status with proper mapping
              const shopStatusValues = values.map(status => {
                switch (status.toLowerCase()) {
                  case 'not started':
                    return 'not-started';
                  case 'not-started':
                    return 'not-started';
                  case 'in progress':
                    return 'in-progress';
                  case 'in-progress':
                    return 'in-progress';
                  case 'complete':
                    return 'complete';
                  case 'on hold':
                    return 'on-hold';
                  case 'on-hold':
                    return 'on-hold';
                  case 'in-process':
                    return 'in-process';
                  case 'on-order':
                    return 'on-order';
                  default:
                    return status;
                }
              });
              // Special logic for 'not-started' to exclude other statuses
              if (shopStatusValues.includes('not-started')) {
                // Exclude 'on-order', 'in-process', 'complete'
                query = query
                  .not('shop_status', 'eq', 'on-order')
                  .not('shop_status', 'eq', 'in-process')
                  .not('shop_status', 'eq', 'complete');
              } else {
                query = query.in('shop_status', shopStatusValues);
              }
              break;
            case 'status':
              query = query.in('status', values);
              break;
            case 'assigned_to':
              query = query.in('assigned_to', values);
              break;
            case 'order_type':
              // Handle order type filtering based on boolean fields
              const typeFilters: string[] = [];
              values.forEach(value => {
                switch (value) {
                  case 'R':
                    typeFilters.push('rental.eq.true');
                    break;
                  case 'S':
                    typeFilters.push('sale.eq.true');
                    break;
                  case 'P':
                    typeFilters.push('perm_signs.eq.true');
                    break;
                  case 'M':
                    // Multiple types - need complex filtering
                    // For now, we'll handle this differently or skip
                    break;
                }
              });
              if (typeFilters.length > 0) {
                query = query.or(typeFilters.join(','));
              }
              break;
          }
        }
      }
    }

    // Handle date filtering
    if (filters.dateField && filters.dateField[0] === 'created_at') {
      if (filters.dateFrom && filters.dateFrom[0]) {
        query = query.gte('created_at', filters.dateFrom[0]);
      }
      if (filters.dateTo && filters.dateTo[0]) {
        // Add one day to include the entire end date
        const endDate = new Date(filters.dateTo[0]);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString().split('T')[0]);
      }
    }

    let paginationCountQuery = supabase
    .from('sign_orders')
    .select('*', { count: 'exact', head: true });
  

    // Apply the same date filtering for pagination count
    if (filters.dateField && filters.dateField[0] === 'created_at') {
      if (filters.dateFrom && filters.dateFrom[0]) {
        paginationCountQuery = paginationCountQuery.gte('created_at', filters.dateFrom[0]);
      }
      if (filters.dateTo && filters.dateTo[0]) {
        const endDate = new Date(filters.dateTo[0]);
        endDate.setDate(endDate.getDate() + 1);
        paginationCountQuery = paginationCountQuery.lt('created_at', endDate.toISOString().split('T')[0]);
      }
    }

    // Apply the same filters for pagination count
    if (filters && Object.keys(filters).length > 0) {
      for (const [field, values] of Object.entries(filters)) {
        if (values && Array.isArray(values) && values.length > 0 && field !== 'dateField' && field !== 'dateFrom' && field !== 'dateTo') {
          switch (field) {
          }
        }
      }
    }

    // Apply the same archived filtering
    if (isArchivedFilter) {
      paginationCountQuery = paginationCountQuery.eq('archived', true);
    } else if (excludeArchived || (!isArchivedFilter && !statusParam?.includes('Draft'))) {
      paginationCountQuery = paginationCountQuery.or('archived.is.null,archived.eq.false');
    }
    
    // Apply the same status filtering
    if (statusParam && statusParam.includes('Draft')) {
      const statuses = statusParam.split(',').map(s => s.trim());
      const statusValues: string[] = [];
      statuses.forEach(status => {
        statusValues.push(status, status.toLowerCase(), status.toUpperCase());
      });
      paginationCountQuery = paginationCountQuery.in('status', statusValues);
    }
    
    // Apply the same branch filtering for pagination count
    if (branch && branch !== 'all' && branch !== 'archived') {
      const branchNameToIdMap: Record<string, number> = {
        'turbotville': 1,
        'hatfield': 2,
        'bedford': 3
      };
      
      const branchId = branchNameToIdMap[branch.toLowerCase()];
      if (branchId) {
        const branchUsers = (users || []).filter(user => user.branch_id === branchId);
        const userNames = branchUsers.map(user => user.name);
        if (userNames.length > 0) {
          paginationCountQuery = paginationCountQuery.in('requestor', userNames);
        }
      }
    }

    // Apply the same filters for pagination count
    if (filters && Object.keys(filters).length > 0) {
      for (const [field, values] of Object.entries(filters)) {
        if (values && Array.isArray(values) && values.length > 0) {
          switch (field) {
            case 'customer':
              const contractorIds = (contractors || [])
                .filter(contractor => values.includes(contractor.display_name))
                .map(contractor => contractor.id);
              if (contractorIds.length > 0) {
                paginationCountQuery = paginationCountQuery.in('contractor_id', contractorIds);
              }
              break;
            case 'requestor':
              paginationCountQuery = paginationCountQuery.in('requestor', values);
              break;
            case 'branch':
              const branchNameToIdMap: Record<string, number> = {
                'hatfield': 2,
                'turbotville': 1,
                'bedford': 3
              };
              const branchIds = values.map(name => branchNameToIdMap[name.toLowerCase()]).filter(id => id !== undefined);
              if (branchIds.length > 0) {
                const branchUsers = (users || []).filter(user => branchIds.includes(user.branch_id));
                const userNames = branchUsers.map(user => user.name);
                if (userNames.length > 0) {
                  paginationCountQuery = paginationCountQuery.in('requestor', userNames);
                }
              }
              break;
            case 'job_number':
              paginationCountQuery = paginationCountQuery.in('job_number', values);
              break;
            case 'contract_number':
              paginationCountQuery = paginationCountQuery.in('contract_number', values);
              break;
            case 'shop_status':
              const shopStatusValues = values.map(status => {
                switch (status.toLowerCase()) {
                  case 'not started':
                  case 'not-started':
                    return 'not-started';
                  case 'in progress':
                  case 'in-progress':
                    return 'in-progress';
                  case 'complete':
                    return 'complete';
                  case 'on hold':
                  case 'on-hold':
                    return 'on-hold';
                  default:
                    return status;
                }
              });
              if (shopStatusValues.includes('not-started')) {
                // Exclude 'on-order', 'in-process', 'complete'
                paginationCountQuery = paginationCountQuery
                  .not('shop_status', 'eq', 'on-order')
                  .not('shop_status', 'eq', 'in-process')
                  .not('shop_status', 'eq', 'complete');
              } else {
                paginationCountQuery = paginationCountQuery.in('shop_status', shopStatusValues);
              }
              break;
            case 'status':
              paginationCountQuery = paginationCountQuery.in('status', values);
              break;
            case 'assigned_to':
              paginationCountQuery = paginationCountQuery.in('assigned_to', values);
              break;
            case 'order_type':
              const typeFilters: string[] = [];
              values.forEach(value => {
                switch (value) {
                  case 'R':
                    typeFilters.push('rental.eq.true');
                    break;
                  case 'S':
                    typeFilters.push('sale.eq.true');
                    break;
                  case 'P':
                    typeFilters.push('perm_signs.eq.true');
                    break;
                }
              });
              if (typeFilters.length > 0) {
                paginationCountQuery = paginationCountQuery.or(typeFilters.join(','));
              }
              break;
          }
        }
      }
    }
    
    const { count: totalCount, error: countError } = await paginationCountQuery;

    if (countError) {
      console.error('Error fetching total count:', countError);
      return NextResponse.json({ success: false, error: 'Failed to fetch total count' }, { status: 500 });
    }

    // Apply sorting and pagination to the main query
    // Map frontend column names to actual database columns
    let actualOrderBy = orderBy;
    switch (orderBy) {
      case 'branch':
        // Can't sort by computed field in database - we'll handle this in post-processing
        actualOrderBy = 'requestor'; // Sort by requestor instead
        break;
      case 'customer':
        // Can't sort by computed field in database - we'll handle this in post-processing
        actualOrderBy = 'contractor_id'; // Sort by contractor_id instead
        break;
      case 'order_type':
        // Can't sort by computed field - use created_at as fallback
        actualOrderBy = 'created_at';
        break;
      default:
        // Use the original orderBy if it maps to a real database column
        break;
    }

    // Apply sorting if it's a real database column
    if (['id', 'requestor', 'contractor_id', 'job_number', 'contract_number', 'order_date', 'need_date', 'status', 'shop_status', 'order_number', 'assigned_to', 'created_at'].includes(actualOrderBy)) {
      query = query.order(actualOrderBy, { ascending });
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    query = query.range(startIndex, startIndex + limit - 1);

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Process the orders to add formatted fields and resolve references
    const processedOrders = (orders || []).map((order: any) => {
      // Format dates for consistent display
      const orderDate = order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : null;
      const needDate = order.need_date ? new Date(order.need_date).toISOString().split('T')[0] : null;
      
      // Get customer name from the contractor mapping
      const customerName = order.contractor_id ? contractorNameMap[order.contractor_id] || '-' : '-';
      
      // Get branch name from the user and branch mappings
      const userBranchId = userBranchMap[order.requestor];
      const branchName = userBranchId ? branchNameMap[userBranchId] || 'Unknown' : 'Unknown';
      
      return {
        ...order,
        customer: customerName,
        branch: branchName,
        assigned_to: order.assigned_to || 'Unassigned',
        type: '-',
        order_date: orderDate,
        need_date: needDate,
        shop_status: order.shop_status || '',
        order_type: (() => {
          const typeCount = [order.rental, order.sale, order.perm_signs].filter(Boolean).length;
          if (typeCount > 1) return 'M';
          if (order.rental) return 'R';
          if (order.sale) return 'S';
          if (order.perm_signs) return 'P';
          return '-';
        })(),
      };
    });

    // Handle sorting for computed fields (branch, customer, order_type)
    if (['branch', 'customer', 'order_type'].includes(orderBy)) {
      processedOrders.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (orderBy) {
          case 'branch':
            aValue = a.branch;
            bValue = b.branch;
            break;
          case 'customer':
            aValue = a.customer;
            bValue = b.customer;
            break;
          case 'order_type':
            aValue = a.order_type;
            bValue = b.order_type;
            break;
          default:
            aValue = a[orderBy];
            bValue = b[orderBy];
        }

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return ascending ? -1 : 1;
        if (bValue == null) return ascending ? 1 : -1;

        // Convert to strings for comparison
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        const comparison = aStr.localeCompare(bStr);
        return ascending ? comparison : -comparison;
      });
    }

    // Calculate total pages for pagination
    const pages = Math.ceil((totalCount || 0) / limit);
    
    return NextResponse.json({
      success: true,
      orders: processedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages
      }
    });
  } catch (error) {
    console.error('Error processing sign shop orders request:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}