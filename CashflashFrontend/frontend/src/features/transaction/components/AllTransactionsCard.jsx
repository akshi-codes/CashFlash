import { useEffect, useMemo, useState } from "react";
import {
  getAllTransactions,
  getTransactions,
} from "@/features/transaction/services/transaction.services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ReceiptText, X } from "lucide-react";
import { useSelector } from "react-redux";

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

export default function AllTransactionsCard({ onClose, initialSearch = "" }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [directionFilter, setDirectionFilter] = useState("ALL");

  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    setLoading(true);

    const request = isAdmin ? getAllTransactions() : getTransactions();

    request
      .then((res) => setTransactions(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error("Failed to load transactions", err);
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((tx) => {
      const label = TransactionLabels[tx.transactionType] ?? tx.transactionType;
      const createdAtText = tx.createdAt
        ? formatDate(tx.createdAt).toLowerCase()
        : "";

      const matchesSearch = isAdmin
        ? !query ||
          String(tx.transactionId ?? "").includes(query) ||
          tx.senderName?.toLowerCase().includes(query) ||
          tx.receiverName?.toLowerCase().includes(query) ||
          tx.referenceId?.toLowerCase().includes(query) ||
          label?.toLowerCase().includes(query) ||
          tx.status?.toLowerCase().includes(query) ||
          String(tx.amount ?? "").includes(query) ||
          createdAtText.includes(query)
        : !query ||
          tx.name?.toLowerCase().includes(query) ||
          label?.toLowerCase().includes(query) ||
          tx.status?.toLowerCase().includes(query) ||
          tx.direction?.toLowerCase().includes(query) ||
          String(tx.amount ?? "").includes(query) ||
          createdAtText.includes(query);

      const matchesStatus =
        statusFilter === "ALL" || tx.status === statusFilter;

      const matchesDirection =
        isAdmin ||
        directionFilter === "ALL" ||
        tx.direction === directionFilter;

      return matchesSearch && matchesStatus && matchesDirection;
    });
  }, [transactions, search, statusFilter, directionFilter, isAdmin]);

  function maskRef(ref) {
    if (!ref) return "-";
    const last5 = ref.slice(-5);
    return `•••••••${last5}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm p-4 pt-10">
      <div
        className="relative h-[78vh] w-[96vw] max-w-7xl rounded-2xl border bg-card p-4 shadow-xl animate-in scale-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="mb-4 flex items-center gap-2 pr-12">
          <ReceiptText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {isAdmin ? "All Transactions" : "My Transactions"}
          </h2>
        </div>

        <div
          className={`mb-4 grid grid-cols-1 gap-3 ${
            isAdmin ? "md:grid-cols-2" : "md:grid-cols-3"
          }`}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isAdmin
                  ? "Search sender, receiver, type, status, amount or date..."
                  : "Search name, type, status, amount or date..."
              }
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="z-10001">
              <SelectItem value="ALL">Filter by status</SelectItem>
              <SelectItem value="SUCCESSFUL">Successful</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>

          {!isAdmin && (
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by direction" />
              </SelectTrigger>
              <SelectContent className="z-10001">
                <SelectItem value="ALL">Filter by direction</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
                <SelectItem value="SELF">Self</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <div className="flex h-[calc(78vh-8.5rem)] items-center justify-center">
            <p className="text-muted-foreground text-center text-sm">
              Loading transactions…
            </p>
          </div>
        ) : (
          <div className="h-[calc(78vh-8.5rem)] overflow-hidden rounded-xl border bg-background">
            {isAdmin ? (
              <>
                <div className="sticky top-0 z-40 border-b bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-37">Transaction ID</TableHead>
                        <TableHead className="w-60">Sender</TableHead>
                        <TableHead className="w-62">Receiver</TableHead>
                        <TableHead className="w-58">Reference ID</TableHead>
                        <TableHead className="w-77">Description</TableHead>
                        <TableHead className="w-42">Status</TableHead>
                        <TableHead className="w-40">Amount</TableHead>
                        <TableHead className="w-40">At</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>

                <div className="h-[calc(100%-3rem)] overflow-y-auto no-scrollbar overscroll-contain">
                  <Table>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="py-10 text-center text-sm text-muted-foreground"
                          >
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <TableRow
                            key={tx.transactionId}
                            className="transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium w-45">
                              {tx.transactionId}
                            </TableCell>

                            <TableCell className="font-medium w-60">
                              {tx.senderName ?? "-"}
                            </TableCell>

                            <TableCell className="font-medium w-60">
                              {tx.receiverName ?? "-"}
                            </TableCell>

                            <TableCell className="font-medium w-54">
                              {maskRef(tx.referenceId)}
                            </TableCell>

                            <TableCell className="text-muted-foreground w-79">
                              {TransactionLabels[tx.transactionType] ??
                                tx.transactionType}
                            </TableCell>

                            <TableCell>
                              <span
                                className={
                                  tx.status === "SUCCESSFUL"
                                    ? "text-green-600 w-40"
                                    : tx.status === "FAILED"
                                      ? "text-red-600 w-40"
                                      : "text-yellow-600 w-40"
                                }
                              >
                                {tx.status}
                              </span>
                            </TableCell>

                            <TableCell className="font-semibold text-foreground w-40 pl-10">
                              ₹ {Number(tx.amount ?? 0).toLocaleString("en-IN")}
                            </TableCell>

                            <TableCell className="text-left text-muted-foreground w-40">
                              {formatDate(tx.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <>
                <div className="sticky top-0 z-40 border-b bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-52">Name</TableHead>
                        <TableHead className="w-54">Reference ID</TableHead>
                        <TableHead className="w-79">Description</TableHead>
                        <TableHead className="w-68">Status</TableHead>
                        <TableHead className="w-54">Amount</TableHead>
                        <TableHead className="w-56">At</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>

                <div className="h-[calc(100%-3rem)] overflow-y-auto no-scrollbar overscroll-contain">
                  <Table>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-sm text-muted-foreground"
                          >
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((tx) => {
                          const amountColor =
                            tx.direction === "RECEIVED"
                              ? "text-green-600"
                              : tx.direction === "SENT"
                                ? "text-red-600"
                                : "text-yellow-600";

                          return (
                            <TableRow
                              key={tx.transactionId}
                              className="transition-colors hover:bg-muted/50"
                            >
                              <TableCell className="w-54 font-medium">
                                {tx.name}
                              </TableCell>

                              <TableCell className="w-54 font-medium">
                                {maskRef(tx.referenceId)}
                              </TableCell>

                              <TableCell className="w-82 text-muted-foreground">
                                {TransactionLabels[tx.transactionType] ??
                                  tx.transactionType}
                              </TableCell>

                              <TableCell className="w-67.5">
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
                                {formatDate(tx.createdAt)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
