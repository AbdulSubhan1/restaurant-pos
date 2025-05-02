import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { verifyToken } from "@/lib/auth-utils";
import { eq, desc, sql, or } from "drizzle-orm";

// GET handler for listing users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the token and check if user is admin
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Only allow admin users to access the user list
    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const active = searchParams.get("active");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "id";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = sql`1=1`;

    if (role) {
      whereConditions = sql`${whereConditions} AND ${users.role} = ${role}`;
    }

    if (active) {
      const isActive = active === "true";
      whereConditions = sql`${whereConditions} AND ${users.active} = ${isActive}`;
    }

    if (search) {
      whereConditions = sql`${whereConditions} AND (
        ${users.name} ILIKE ${`%${search}%`} OR 
        ${users.email} ILIKE ${`%${search}%`}
      )`;
    }

    // Count total users matching the filter
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereConditions);

    const total = countResult[0]?.count || 0;

    // Fix: Using raw SQL with parameter binding for safe query construction
    // Define the select part of the query with fields we want
    const selectSQL = sql`
      SELECT 
        id, name, email, role, active, created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE ${whereConditions}
    `;

    // Add ORDER BY clause based on user's selection
    let orderByClause;
    const orderDir = sortOrder === "desc" ? "DESC" : "ASC";

    // Safely handle column names with proper quoting
    switch (sortBy) {
      case "name":
        orderByClause = sql`ORDER BY name ${sql.raw(orderDir)}`;
        break;
      case "email":
        orderByClause = sql`ORDER BY email ${sql.raw(orderDir)}`;
        break;
      case "role":
        orderByClause = sql`ORDER BY role ${sql.raw(orderDir)}`;
        break;
      case "createdAt":
        orderByClause = sql`ORDER BY created_at ${sql.raw(orderDir)}`;
        break;
      default:
        orderByClause = sql`ORDER BY id ${sql.raw(orderDir)}`;
    }

    // Add pagination
    const paginationClause = sql`LIMIT ${limit} OFFSET ${offset}`;

    // Combine all clauses into one query
    const finalQuery = sql`${selectSQL} ${orderByClause} ${paginationClause}`;

    // Execute the query
    const usersList = await db.execute(finalQuery);

    // Remove sensitive information like passwords before sending to client
    const safeUsersList = usersList.map((user) => {
      return {
        ...user,
        // Don't send password even though it should already be excluded in the select
        password: undefined,
      };
    });

    // Return paginated results with metadata
    return NextResponse.json({
      success: true,
      users: safeUsersList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new user
export async function POST(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the token and check if user is admin
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Only allow admin users to create users
    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, email, password, role = "server", active = true } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email already in use" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "manager", "server", "kitchen"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role" },
        { status: 400 }
      );
    }

    // Hash password
    const bcrypt = require("bcrypt");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user
    const result = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
        active,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: result[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
