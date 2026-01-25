/**
 * India Angel Forum - Core Entity Exports
 * 
 * This module exports all core domain entities following India's
 * regulatory framework for angel investing:
 * - SEBI AIF Regulations
 * - SEBI Accredited Investor Framework
 * - KYC/AML (PML Act, SEBI guidelines)
 * - FEMA/FDI regulations for foreign investors
 * - Companies Act Section 42 (Private Placement)
 * - DPDP Act 2023 (Data Protection)
 */

// Deal management (Section 18.1 of gaps.md)
export * from './deal';

// Investor management with KYC (Section 18.2 of gaps.md)
export * from './investor';

// Escrow & Virtual Accounts (Section 18.3 of gaps.md)
export * from './escrow';
