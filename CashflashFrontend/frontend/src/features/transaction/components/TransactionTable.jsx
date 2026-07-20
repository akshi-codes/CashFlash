import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTransactions } from "@/features/transaction/services/transaction.services";

const TransactionLabels = {
  USER_WALLET_TO_USER_BANK: "Wallet → Bank Transfer",
  USER_BANK_TO_USER_BANK: "Bank → Bank Transfer",
  USER_CARD_TO_USER_BANK: "Card → Bank Transfer",
  USER_BANK_TO_SELF_WALLET: "Wallet Top-Up",
  USER_WALLET_TO_SELF_BANK: "Wallet Withdrawal",
  USER_WALLET_TO_MERCHANT_BANK: "Wallet → Merchant Payment",
  USER_BANK_TO_MERCHANT_BANK: "Bank → Merchant Payment",
  USER_CARD_TO_MERCHANT_BANK: "Card → Merchant Payment",
  MERCHANT_BANK_TO_USER_BANK: "Refund from Merchant",
};

const TransactionTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions()
      .then((res) => setTransactions(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-muted-foreground text-center text-sm py-10">
        Loading transactions…
      </p>
    );
  }

  return (
    <div className="w-full border rounded-xl bg-background ">
      {/* Sticky Header (separate table) */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <Table card-glow="true">
          <TableHeader>
            <TableRow>
              <TableHead className="w-54">Name</TableHead>
              <TableHead className="w-82">Description</TableHead>
              <TableHead className="w-67.5">Status</TableHead>
              <TableHead className="w-55">Amount</TableHead>
              <TableHead className="w-55">At</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable body */}
      <div className="max-h-105 overflow-y-auto no-scrollbar">
        <Table>
          <TableBody>
            {transactions.map((tx) => {
              const amountColor =
                tx.direction === "RECEIVED"
                  ? "text-green-600"
                  : tx.direction === "SENT"
                  ? "text-red-600"
                  : "text-yellow-600";

              return (
                <TableRow
                  key={tx.transactionId}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="w-54 font-medium">{tx.name}</TableCell>

                  <TableCell className="w-82 text-muted-foreground">
                    {TransactionLabels[tx.transactionType] ??
                      tx.transactionType}
                  </TableCell>

                  <TableCell  className="w-67.5">
                    <span
                      className={
                        tx.status === "SUCCESSFUL"
                          ? "text-green-600"
                          : tx.status === "FAILED"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }
                    >
                      {tx.status}
                    </span>
                  </TableCell>

                  <TableCell
                    className={`w-55 font-semibold ${amountColor}`}
                  >
                    ₹ {Number(tx.amount).toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="w-55 text-left text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString()}
                  </TableCell>

                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionTable;
