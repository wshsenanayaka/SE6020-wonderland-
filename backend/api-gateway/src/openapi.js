export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Wonderland Theme Park API',
    version: '1.0.0',
    description: 'API documentation for the Wonderland React frontend and Node.js microservices backend.',
  },
  servers: [
    {
      url: 'http://127.0.0.1:8089',
      description: 'Local API Gateway',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Visitor and administrator login session APIs' },
    { name: 'Users', description: 'Visitor registration and profile APIs' },
    { name: 'Platform', description: 'Home, dashboard, attraction, ticket, booking, and analytics data' },
    { name: 'Bookings', description: 'Ticket booking and booking email APIs' },
    { name: 'Payments', description: 'Stripe sandbox payment confirmation APIs' },
    { name: 'Activities', description: 'Administrator attraction management APIs' },
    { name: 'Ticket Passes', description: 'Administrator ticket pass management APIs' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Platform'],
        summary: 'Check API Gateway health',
        responses: {
          200: {
            description: 'Gateway is running',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/platform-data': {
      get: {
        tags: ['Platform'],
        summary: 'Get all public platform data',
        description: 'Returns visible attractions, ticket passes, operations data, profile cookies, and visitor bookings when a visitor is logged in.',
        responses: {
          200: {
            description: 'Platform data loaded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PlatformDataResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login as visitor or administrator',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              examples: {
                visitor: {
                  value: {
                    profile_type: 'visitor',
                    email: 'visitor@example.com',
                    password: 'visitor123',
                  },
                },
                administrator: {
                  value: {
                    profile_type: 'admin',
                    email: 'admin@wonderland.com',
                    password: 'admin123',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful. Profile cookies are set by the service.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current profile',
        responses: {
          200: {
            description: 'Profile cookies cleared',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/session': {
      get: {
        tags: ['Auth'],
        summary: 'Get current profile session from cookies',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Current session details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Profile' },
              },
            },
          },
        },
      },
    },
    '/api/users/register': {
      post: {
        tags: ['Users'],
        summary: 'Register a visitor account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VisitorRegisterRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Visitor registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterResponse' },
              },
            },
          },
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/users/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get logged in visitor profile',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Visitor profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VisitorProfileResponse' },
              },
            },
          },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update logged in visitor profile',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VisitorProfileUpdateRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Visitor profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          403: { $ref: '#/components/responses/Forbidden' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/users/visitors': {
      get: {
        tags: ['Users'],
        summary: 'List visitors',
        description: 'Administrative visitor list endpoint.',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Visitor list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Visitor' },
                },
              },
            },
          },
        },
      },
    },
    '/api/business/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Create a ticket booking and Stripe checkout session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookingRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Booking saved and Stripe checkout URL returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BookingResponse' },
              },
            },
          },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/business/bookings/{id}/resend-email': {
      post: {
        tags: ['Bookings'],
        summary: 'Resend paid booking QR email',
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdPath' },
        ],
        responses: {
          200: {
            description: 'Email sent',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
          503: { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },
    '/api/business/bookings/{id}/check-in': {
      post: {
        tags: ['Bookings'],
        summary: 'Mark a paid booking as arrived after scanning the QR code',
        parameters: [
          { $ref: '#/components/parameters/IdPath' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookingCheckInRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Arrival confirmed or booking was already arrived',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BookingCheckInResponse' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/business/stripe/confirm-session': {
      post: {
        tags: ['Payments'],
        summary: 'Confirm a Stripe checkout session after payment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StripeConfirmRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Payment confirmed and booking moved to paid/booked stage',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StripeConfirmResponse' },
              },
            },
          },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/business/activities': {
      post: {
        tags: ['Activities'],
        summary: 'Create an attraction activity or toggle activity visibility',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/ActivityFormRequest' },
            },
            'application/json': {
              schema: { $ref: '#/components/schemas/ActivityJsonRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Activity action completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          403: { $ref: '#/components/responses/Forbidden' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/business/ticket-passes': {
      get: {
        tags: ['Ticket Passes'],
        summary: 'List ticket passes',
        responses: {
          200: {
            description: 'Ticket passes loaded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TicketPassListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Ticket Passes'],
        summary: 'Create a ticket pass',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TicketPassInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Ticket pass inserted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TicketPassMutationResponse' },
              },
            },
          },
          403: { $ref: '#/components/responses/Forbidden' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/business/ticket-passes/{id}': {
      put: {
        tags: ['Ticket Passes'],
        summary: 'Update a ticket pass',
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdPath' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TicketPassInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Ticket pass updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TicketPassMutationResponse' },
              },
            },
          },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Ticket Passes'],
        summary: 'Delete a ticket pass',
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdPath' },
        ],
        responses: {
          200: {
            description: 'Ticket pass deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'wonderland_profile_type',
        description: 'Session cookies are set by `/api/auth/login` and sent with `credentials: include`.',
      },
    },
    parameters: {
      IdPath: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer', example: 1 },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Invalid credentials',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      Forbidden: {
        description: 'Login or permission required',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      NotFound: {
        description: 'Record not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      Conflict: {
        description: 'Duplicate record',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      ValidationError: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      ServiceUnavailable: {
        description: 'External service unavailable or not configured',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
    },
    schemas: {
      MessageResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Action completed successfully.' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Please fill all required fields.' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          service: { type: 'string', example: 'api-gateway' },
          status: { type: 'string', example: 'ok' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['profile_type', 'email', 'password'],
        properties: {
          profile_type: { type: 'string', enum: ['visitor', 'admin'], example: 'visitor' },
          email: { type: 'string', format: 'email', example: 'visitor@example.com' },
          password: { type: 'string', format: 'password', example: 'visitor123' },
        },
      },
      LoginResponse: {
        allOf: [
          { $ref: '#/components/schemas/MessageResponse' },
          {
            type: 'object',
            properties: {
              profile: { $ref: '#/components/schemas/Profile' },
            },
          },
        ],
      },
      Profile: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Hashitha Senanayaka' },
          email: { type: 'string', format: 'email', example: 'visitor@example.com' },
          contact_number: { type: 'string', example: '0704867765' },
          role: { type: 'string', example: 'Administrator' },
          type: { type: 'string', enum: ['visitor', 'admin', ''], example: 'visitor' },
          isLoggedIn: { type: 'boolean', example: true },
        },
      },
      VisitorRegisterRequest: {
        type: 'object',
        required: ['full_name', 'email', 'contact_number', 'password', 'confirm_password'],
        properties: {
          full_name: { type: 'string', example: 'Hashitha Senanayaka' },
          email: { type: 'string', format: 'email', example: 'visitor@example.com' },
          contact_number: { type: 'string', example: '0704867765' },
          password: { type: 'string', format: 'password', example: 'visitor123' },
          confirm_password: { type: 'string', format: 'password', example: 'visitor123' },
        },
      },
      RegisterResponse: {
        allOf: [
          { $ref: '#/components/schemas/MessageResponse' },
          {
            type: 'object',
            properties: {
              visitor_id: { type: 'integer', example: 12 },
            },
          },
        ],
      },
      VisitorProfileUpdateRequest: {
        type: 'object',
        required: ['full_name', 'contact_number'],
        properties: {
          full_name: { type: 'string', example: 'Hashitha Senanayaka' },
          contact_number: { type: 'string', example: '0704867765' },
        },
      },
      VisitorProfileResponse: {
        allOf: [
          { $ref: '#/components/schemas/MessageResponse' },
          {
            type: 'object',
            properties: {
              visitor: { $ref: '#/components/schemas/Visitor' },
            },
          },
        ],
      },
      Visitor: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          full_name: { type: 'string', example: 'Hashitha Senanayaka' },
          email: { type: 'string', format: 'email', example: 'visitor@example.com' },
          contact_number: { type: 'string', example: '0704867765' },
          status: { type: 'integer', example: 1 },
          created_at: { type: 'string', example: '2026-09-20 10:00:00' },
          updated_at: { type: 'string', nullable: true, example: null },
        },
      },
      PlatformDataResponse: {
        type: 'object',
        properties: {
          attractions: { type: 'array', items: { $ref: '#/components/schemas/AttractionCard' } },
          adminActivities: { type: 'array', items: { $ref: '#/components/schemas/AttractionCard' } },
          ticketPasses: { type: 'array', items: { $ref: '#/components/schemas/TicketPass' } },
          ticketTypes: { type: 'object', additionalProperties: { $ref: '#/components/schemas/TicketType' } },
          recentBookings: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
          visitorBookings: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
          profile: { $ref: '#/components/schemas/Profile' },
          auth: {
            type: 'object',
            properties: {
              cognitoEnabled: { type: 'boolean', example: false },
            },
          },
        },
      },
      AttractionCard: {
        type: 'object',
        properties: {
          id: { type: 'integer', nullable: true, example: 1 },
          name: { type: 'string', example: 'Skybolt Hyper Coaster' },
          category: { type: 'string', example: 'Thrill' },
          ride_type: { type: 'string', example: 'Thrill Ride' },
          zone: { type: 'string', example: 'Summit Zone' },
          wait: { type: 'number', example: 18 },
          capacity: { type: 'number', example: 400 },
          status: { type: 'string', example: 'Operational' },
          tagline: { type: 'string', example: 'High speed launches, skyline drops, and a full-loop finish.' },
          icon: { type: 'string', example: 'mdi-rocket-launch' },
          color: { type: 'string', example: '#ee3e50' },
          details: { type: 'array', items: { type: 'string' }, example: ['3 min', 'Min 140cm'] },
          background_image: { type: 'string', example: 'assets/images/activities/activity.jpg' },
          image_position: { type: 'string', example: 'center' },
          is_visible: { type: 'integer', example: 1 },
        },
      },
      TicketPass: {
        allOf: [
          { $ref: '#/components/schemas/TicketPassInput' },
          {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              status: { type: 'integer', example: 1 },
              created_at: { type: 'string', example: '2026-09-20 10:00:00' },
              updated_at: { type: 'string', nullable: true, example: null },
            },
          },
        ],
      },
      TicketPassInput: {
        type: 'object',
        required: ['ticket_tier', 'guests', 'currency_code', 'ticket_price_indicative', 'effective_price_per_guest'],
        properties: {
          ticket_tier: { type: 'string', example: 'Adult Day Pass' },
          guests: { type: 'string', example: '1 Adult' },
          currency_code: { type: 'string', enum: ['USD', 'LKR'], example: 'USD' },
          ticket_price_indicative: { type: 'number', example: 48 },
          effective_price_per_guest: { type: 'number', example: 48 },
        },
      },
      TicketType: {
        type: 'object',
        properties: {
          label: { type: 'string', example: 'Adult Day Pass' },
          price: { type: 'number', example: 48 },
          guests: { type: 'string', example: '1 Adult' },
          currency_code: { type: 'string', enum: ['USD', 'LKR'], example: 'USD' },
          effective_price_per_guest: { type: 'number', example: 48 },
          note: { type: 'string', example: '1 Adult / USD 48 per guest' },
        },
      },
      TicketPassListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          ticketPasses: { type: 'array', items: { $ref: '#/components/schemas/TicketPass' } },
        },
      },
      TicketPassMutationResponse: {
        allOf: [
          { $ref: '#/components/schemas/MessageResponse' },
          {
            type: 'object',
            properties: {
              ticketPass: { $ref: '#/components/schemas/TicketPass' },
            },
          },
        ],
      },
      BookingRequest: {
        type: 'object',
        required: ['visitor_name', 'email', 'visit_date', 'preferred_time_slot', 'ticket_type', 'quantity', 'contact_number'],
        properties: {
          visitor_name: { type: 'string', example: 'Hashitha Senanayaka' },
          email: { type: 'string', format: 'email', example: 'visitor@example.com' },
          visit_date: { type: 'string', format: 'date', example: '2026-09-24' },
          preferred_time_slot: { type: 'string', example: '12:00 PM - 03:00 PM' },
          ticket_type: { type: 'string', example: '1' },
          quantity: { type: 'integer', minimum: 1, maximum: 20, example: 1 },
          contact_number: { type: 'string', example: '0704867765' },
        },
      },
      BookingResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Booking saved. Redirecting to Stripe payment.' },
          booking_id: { type: 'integer', example: 25 },
          checkout_url: { type: 'string', format: 'uri', example: 'https://checkout.stripe.com/c/pay/cs_test_...' },
        },
      },
      BookingCheckInRequest: {
        type: 'object',
        required: ['qr_token'],
        properties: {
          qr_token: { type: 'string', example: '3d0f6fc9-c9f6-4d0c-bf24-9808dd04d3a1' },
        },
      },
      BookingCheckInResponse: {
        allOf: [
          { $ref: '#/components/schemas/MessageResponse' },
          {
            type: 'object',
            properties: {
              already_arrived: { type: 'boolean', example: false },
              booking: { $ref: '#/components/schemas/Booking' },
            },
          },
        ],
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          visitor_name: { type: 'string', example: 'Hashitha Senanayaka' },
          email: { type: 'string', format: 'email', example: 'visitor@example.com' },
          visit_date: { type: 'string', example: '2026-09-24' },
          preferred_time_slot: { type: 'string', example: '12:00 PM - 03:00 PM' },
          ticket_type: { type: 'string', example: '1' },
          ticket_label: { type: 'string', example: 'Adult Day Pass' },
          quantity: { type: 'integer', example: 1 },
          contact_number: { type: 'string', example: '0704867765' },
          currency_code: { type: 'string', enum: ['USD', 'LKR'], example: 'USD' },
          total: { type: 'number', example: 48 },
          payment_status: { type: 'string', example: 'Paid' },
          booking_status: { type: 'string', example: 'Booked' },
          qr_token: { type: 'string', example: '3d0f6fc9-c9f6-4d0c-bf24-9808dd04d3a1' },
          checkin_status: { type: 'string', example: 'Arrived' },
          arrived_at: { type: 'string', nullable: true, example: '2026-09-21T10:30:00.000Z' },
          qr_code_path: { type: 'string', example: 'assets/qrcodes/booking-1.png' },
          stripe_session_id: { type: 'string', example: 'cs_test_...' },
          created_at: { type: 'string', example: '2026-09-20T10:00:00.000Z' },
        },
      },
      StripeConfirmRequest: {
        type: 'object',
        required: ['session_id'],
        properties: {
          session_id: { type: 'string', example: 'cs_test_a1b2c3' },
        },
      },
      StripeConfirmResponse: {
        allOf: [
          { $ref: '#/components/schemas/MessageResponse' },
          {
            type: 'object',
            properties: {
              email_sent: { type: 'boolean', example: true },
            },
          },
        ],
      },
      ActivityJsonRequest: {
        type: 'object',
        description: 'Use `action: toggle` with `activity_id` and `is_visible`, or omit action/create to insert a new activity.',
        properties: {
          action: { type: 'string', enum: ['create', 'toggle'], example: 'create' },
          activity_id: { type: 'integer', example: 1 },
          is_visible: { type: 'integer', enum: [0, 1], example: 1 },
          category: { type: 'string', example: 'Thrill' },
          ride_type: { type: 'string', example: 'Thrill Ride' },
          name: { type: 'string', example: 'Skybolt Hyper Coaster' },
          tagline: { type: 'string', example: 'High speed launches, skyline drops, and a full-loop finish.' },
          duration_label: { type: 'string', example: '3 min' },
          requirement_label: { type: 'string', example: 'Min 140cm' },
          background_image_path: { type: 'string', example: 'assets/images/wonderland-hero.png' },
          icon: { type: 'string', example: 'mdi-rocket-launch' },
          color: { type: 'string', example: '#ee3e50' },
          zone: { type: 'string', example: 'Summit Zone' },
          wait: { type: 'number', example: 18 },
          capacity: { type: 'number', example: 400 },
          status: { type: 'string', example: 'Operational' },
        },
      },
      ActivityFormRequest: {
        allOf: [
          { $ref: '#/components/schemas/ActivityJsonRequest' },
          {
            type: 'object',
            properties: {
              background_image: {
                type: 'string',
                format: 'binary',
                description: 'Optional uploaded background image file.',
              },
            },
          },
        ],
      },
    },
  },
};
