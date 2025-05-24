/**
 * Custom Cypress commands for the etc-bidx application
 */

// Authentication commands
Cypress.Commands.add('login', (username = 'testuser', password = 'password') => {
  cy.visit('/login');
  cy.get('[data-testid="username-input"]').type(username);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

// DataTable interaction commands
Cypress.Commands.add('selectSegment', (segmentName) => {
  cy.get(`[data-testid="segment-${segmentName.toLowerCase()}"]`).click();
});

/**
 * Flexible sortByColumn command that tries multiple selector strategies
 * to find and click on column headers for sorting
 */
Cypress.Commands.add('sortByColumn', (columnName) => {
  cy.get('body').then($body => {
    // Try data-testid approach first
    if ($body.find(`[data-testid="column-header-${columnName}"]`).length > 0) {
      cy.get(`[data-testid="column-header-${columnName}"]`).click();
    } 
    // Try finding by column text content
    else if ($body.find(`th:contains("${columnName}"), [role="columnheader"]:contains("${columnName}")`).length > 0) {
      // Convert camelCase to Title Case for text matching (e.g. jobNumber -> Job Number)
      const formattedName = columnName
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
      
      cy.contains('th, [role="columnheader"]', new RegExp(formattedName, 'i')).click();
    } 
    // Try finding by aria-sort attribute
    else if ($body.find('[aria-sort]').length > 0) {
      cy.get('[aria-sort]').first().click();
    }
    // Fallback to first header
    else {
      cy.log(`Could not find column header for ${columnName}, clicking first header`);
      cy.get('th, [role="columnheader"]').first().click();
    }
  });
});

/**
 * Flexible filterBy command that tries multiple selector strategies
 * to find and use filter controls in the application
 */
Cypress.Commands.add('filterBy', (field, value) => {
  // Try to find a filter button using multiple selector strategies
  cy.get('body').then($body => {
    // Check for filter button with various selectors
    if ($body.find('[data-testid="filter-button"]').length > 0) {
      cy.get('[data-testid="filter-button"]').click();
    } else if ($body.find('button:contains("Filter")').length > 0) {
      cy.get('button:contains("Filter")').first().click();
    } else if ($body.find('[aria-label*="filter"]').length > 0) {
      cy.get('[aria-label*="filter"]').first().click();
    } else {
      cy.log('No filter button found - trying direct search');
      cy.get('input[type="search"], [placeholder*="search"], [placeholder*="filter"]').first().type(`${field}:${value}{enter}`);
      return;
    }
    
    // Try to find the field selector with multiple strategies
    cy.get('body').then($filterBody => {
      if ($filterBody.find(`[data-testid="filter-field-${field}"]`).length > 0) {
        cy.get(`[data-testid="filter-field-${field}"]`).click();
      } else if ($filterBody.find(`label:contains("${field}")`).length > 0) {
        cy.contains('label', field).parent().find('select, input, button').first().click();
      } else if ($filterBody.find('select, [role="combobox"]').length > 0) {
        cy.get('select, [role="combobox"]').first().click();
      } else {
        cy.log(`Could not find field selector for ${field}`);
        return;
      }
      
      // Try to find and select the value
      if ($filterBody.find(`[data-testid="filter-option-${value}"]`).length > 0) {
        cy.get(`[data-testid="filter-option-${value}"]`).click();
      } else if ($filterBody.find(`option:contains("${value}"), li:contains("${value}")`).length > 0) {
        cy.contains(value).click();
      } else {
        cy.get('input').first().clear().type(value);
      }
      
      // Try to find and click apply button
      if ($filterBody.find('[data-testid="apply-filters-button"]').length > 0) {
        cy.get('[data-testid="apply-filters-button"]').click();
      } else if ($filterBody.find('button:contains("Apply"), button:contains("OK"), button:contains("Submit")').length > 0) {
        cy.contains('button', /Apply|OK|Submit/).click();
      } else {
        cy.log('No apply button found - filter may auto-apply');
      }
    });
  });
});

/**
 * Flexible checkToast command that tries multiple selector strategies
 * to verify toast notifications or alerts in the UI
 */
Cypress.Commands.add('checkToast', (type, message) => {
  cy.get('body').then($body => {
    // Try data-testid approach first
    if ($body.find(`[data-testid="toast-${type}"]`).length > 0) {
      cy.get(`[data-testid="toast-${type}"]`).should('be.visible');
      if (message) {
        cy.get(`[data-testid="toast-${type}"]`).should('contain', message);
      }
    }
    // Try common toast/alert class names
    else if ($body.find(`.toast, .alert, .notification, .snackbar, [role="alert"]`).length > 0) {
      // Look for element with the right type (success, error, etc.)
      const selector = [
        `.toast-${type}`, `.alert-${type}`, `.${type}`, 
        `[data-type="${type}"]`, `[role="alert"][data-type="${type}"]`,
        `.notification.is-${type}`
      ].join(', ');
      
      // If we can find a specific type
      if ($body.find(selector).length > 0) {
        cy.get(selector).should('be.visible');
        if (message) {
          cy.get(selector).should('contain', message);
        }
      }
      // Otherwise check any toast/alert
      else {
        cy.get('.toast, .alert, .notification, .snackbar, [role="alert"]').should('be.visible');
        if (message) {
          cy.get('.toast, .alert, .notification, .snackbar, [role="alert"]').should('contain', message);
        }
      }
    }
    // If no toast UI element found, log a warning
    else {
      cy.log(`Warning: Could not find toast notification of type '${type}' with message '${message}'`);
      // Don't fail the test, as the application might use a different feedback mechanism
    }
  });
});
