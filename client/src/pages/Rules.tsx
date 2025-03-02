import React from "react";
import Header from "../components/Header";
import Links from "../components/Links";
import { Link } from "react-router-dom";

function Rules() {
  return (
    <main className=" text-white">
      <header className="top-0 w-full z-50 h-[100px] lg:h-[200px] bg-gradient-to-b from-black/50 to-transparent font-ge-bold">
        <div className="container mx-auto px-4   h-full flex items-center lg:justify-between justify-between lg:mt-[-1.75rem] mt-0">
          <div className="lg:w-1/3 lg:block hidden">{/* <Counter /> */}</div>
          <a
            href="#home"
            className="block lg:hidden text-white text-sm hover:text-pink  lg:text-xl text-md transition-all duration-200 ease-in-out"
          >
            წესები
          </a>
          <div className="flex items-center">
            <Link to="/">
              <img
                src="/xelovniki.png"
                alt="Logo"
                className="lg:w-[220px] w-[150px]  "
              />
            </Link>
          </div>
          <div className="lg:w-1/3 flex justify-end items-center lg:space-x-4 space-x-0 gap-16 lg:pt-3 pt-0">
            <Link
              to="/rules"
              className="hidden lg:block text-white hover:text-pink  text-xl transition-all duration-200 ease-in-out"
            >
              თამაშის წესები
            </Link>
            <Link
              to="/contact"
              className="text-white hover:text-pink lg:text-xl text-sm transition-all duration-200 ease-in-out"
            >
              კონტაქტი
            </Link>
          </div>
        </div>
      </header>

      <div className="bg-transparant-blabk w-[90vw] rounded-r-[2rem] px-24 py-12">
        <h1 className="font-eurostile-bold text-[42px]">
          <span className="text-light-pink">ხელოვნიკი</span> (წესები და სხვანი)
        </h1>
        <br />
        <br />
        <br />
        <p className="font-eurostile-demi text-[18px]">
          "<span className="text-light-pink">ხელოვნიკი</span>" არის ფერადი,
          მხიარული და მუხანათი თამაში, რომელიც ყველაზე სერიოზულ ენაზეა შექმნილი.
        </p>
        <br /> <br /> <br />
        <p className="font-eurostile-bold text-[20px]">
          <span className="text-light-pink">ხელოვნიკების პირველი წესი:</span>
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          ხელოვნიკი სანამ დალოცავს კანვასს მისი ნიჭით, ჯერ აუცილებლად უნდა
          შეამოწმოს კანვასის ხარისხი სიტყვა "
          <span className="text-light-pink">მზე</span>"-ს რამდენიმე ვარიაციის
          დახატვით. (აუცილებელია ასოები ეხებოდნენ ერთმანეთს)
        </p>
        <br />
        <p className="font-eurostile-bold text-[20px]">
          <span className="text-light-pink">ხელოვნიკების მეორე წესი:</span>
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          არასოდეს არ გამოტოვოთ შანსი ილაპარკოთ{" "}
          <span className="text-light-pink">ხელოვნიკზე</span>. ჩვენ არავის არ
          ვცემთ და <span className="text-light-pink">არც ვასაპონებთ</span>.
        </p>
        <br />
        <p className="font-eurostile-bold text-[20px]">
          <span className="text-light-pink">ხელოვნიკების მესამე წესი:</span>
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          ხელოვნიკი <span className="text-light-pink">არ განსჯის</span>. იგი
          მოკრძალებით ეგებება და{" "}
          <span className="text-light-pink">როგორც მის თანასწორს</span>, ისე
          იღებს სხვა სწავლულს.
        </p>
        <br /> <br />
        <p className="font-eurostile-demi text-[20px]">
          ქვემოთ შესაძლოა მოცემული იყოს ინფორმაცია ამ თამაშზე.
        </p>
        <br />
        <br />
        <br />
        <p className="font-eurostile-bold text-[22px]">როგორ ვითამაშოთ?</p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          "ხელოვნიკი"-ს თამაში მარტივია (თუ ასაკით{" "}
          <span className="text-light-pink">3 თვის ბავშვს</span> აღემატებით):
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; მოთამაშეების რაოდენობა: საჭიროა მინიმუმ 2 მოთამაშე.
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">&bull; როლები:</p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; &nbsp; &nbsp;
          <span className="text-light-pink">&bull; ხელოვნიკი</span> (Drawer):
          ხატავს მოცემულ სიტყვას, რომ სხვებმა გამოიცნონ.
        </p>
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; &nbsp; &nbsp;
          <span className="text-light-pink">&bull; სწავლული</span> (Guesser):
          ცდილობს გამოიცნოს ნახატი.
        </p>
        <br />
        <p className="font-eurostile-bold text-[20px]">
          საკუთარი ოთახის შექმნა:
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          ხარ <span className="text-light-pink">ინტროვერტი მეგობრებით</span>?
          შეგიძლია შექმნა შენი პატარა, ჩაკეტილი და დაცული სივრცე
        </p>
        <p className="font-eurostile-demi text-[18px]">
          სადაც ყველა მხოლოდ{" "}
          <span className="text-light-pink">შენი მეგობარი</span> იქნება.
        </p>
        <p className="font-eurostile-demi text-[18px]">&bull; პარამეტრები</p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; &nbsp; &nbsp; &bull; ხატვის დრო
        </p>
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; &nbsp; &nbsp; &bull; რაუნდების რაოდენობა
        </p>
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; &nbsp; &nbsp; &bull; მაქსიმუმ მოთამაშეები (
          <span className="text-light-pink">16-მდე!</span>)
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; ოთახის <span className="text-light-pink">პაროლი</span>:
          მოიფიქრე ოთახის პაროლი რომელიც მხოლოდ{" "}
          <span className="text-light-pink">თქვენ</span> გეცოდინებათ.
        </p>
        <br />
        <p className="font-eurostile-bold text-[20px]">
          <span className="text-light-pink">საჯარო</span> მატჩმექინგი:
        </p>
        <p className="font-eurostile-demi text-[18px]">
          <br />
          დარჩი მარტო? გრძნობ თავს{" "}
          <span className="text-light-pink">მამაცად</span>? ხოდა შეუერთდი საჯარო
          თამაშს:
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; საჯარო თამაშის კონფიგურაცია
          <span className="text-light-pink"> ასეთია</span>:
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; &nbsp; &nbsp; &bull; <span className="text-light-pink">3</span>{" "}
          რაუნდი
        </p>
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; &nbsp; &nbsp; &bull;{" "}
          <span className="text-light-pink">90</span> წამი ხატვის დრო
        </p>
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; &nbsp; &nbsp; &bull; მაქსიმუმ{" "}
          <span className="text-light-pink">8</span> მოთამაშე
        </p>
        <br />
        <p className="font-eurostile-bold text-[20px]">თამაშის წესები</p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; დაწყება: ოთახის
          <span className="text-light-pink"> ადმინი იწყებს</span>: თამაშს და
          ხატავს პირველი. (ეს პრივილეგია აქვს მას რადგან როგორც ჩანს ყველას
        </p>
        <p className="font-eurostile-demi text-[18px]">
          {" "}
          &nbsp; &nbsp;
          <span className="text-light-pink">დაგეზარათ </span>
          ოთახის შექმნა)
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; <span className="text-light-pink">გამოიცანი</span>: დანარჩენები
          ცდილობენ გამოიცნონ სიტყვა. სიტყვების გამოცნობა ხდება{" "}
          <span className="text-light-pink">მარჯვენა მხარეს</span>განთავსებულ
          ჩატში.
        </p>
        <p className="font-eurostile-demi text-[18px]">
          {" "}
          &nbsp; &nbsp; მოთამაშეებმა უნდა გამოიცნონ სიტყვა მითითებულ დროში,
          <span className="text-light-pink">რაც შეიძლება სწრაფად</span>, რადგან
          რაც უფრო მალე გამოიცნობ,
        </p>
        <p className="font-eurostile-demi text-[18px]">
          {" "}
          &nbsp; მით უფრო <span className="text-light-pink">
            მეტი ქულა
          </span>{" "}
          დაგერიცხება!
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; &nbsp; (ქულები ნამდვილ ვალუთებთან არაფერ კავშირშია მაგრამ მაინც
          "<span className="text-light-pink">გირიცხავთ</span>")
        </p>
        <br />
        <p className="font-eurostile-bold text-[20px]">
          ქულების <span className="text-light-pink">სისტემა</span>:
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; ხატვის დროის პირველ{" "}
          <span className="text-light-pink">10%-ში</span> სწორი პასუხი: 100
          ქულა.
        </p>
        <p className="font-eurostile-demi text-[18px]">
          &bull; დარჩენილ დროში ქულები{" "}
          <span className="text-light-pink">მცირდება</span> დროის{" "}
          <span className="text-light-pink">პროპორციულად</span>.
        </p>
        <p className="font-eurostile-demi text-[18px]">
          &bull; <span className="text-light-pink">ხელოვნიკის ქულა:</span>{" "}
          ხელოვნიკი იღებს სწავლულების ამოცნობილი{" "}
          <span className="text-light-pink">ქულების 20%-ს</span> (როგორც
          სენსეი).
        </p>
        <br />
        <p className="font-eurostile-bold text-[20px]">გამარჯვებული</p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          ეს სექცია მათთვის ვინც{" "}
          <span className="text-light-pink">შეიძლება არ აღემატებოდეს</span>{" "}
          ზემოთ მოცემულ ასაკს:
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; მითითებული რაუნდების{" "}
          <span className="text-light-pink">დასრულების</span> შემდეგ,
          გამოვლინდება გამარჯვებულად მოთამაშე, რომელსაც აქვს{" "}
          <span className="text-light-pink">ყველაზე მეტი</span> ქულა.
        </p>
        <p className="font-eurostile-demi text-[18px]">
          {" "}
          &nbsp; &nbsp; მოყვებიან მეორე და მესამე ადგილოსნები (მაგრამ დიდად
          ეგენი <span className="text-light-pink">არადარდებთ</span> ხოლმე)
        </p>
        <br /> <br />
        <p className="font-eurostile-bold text-[20px]">დამატებითი ფერები</p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; მოთამაშეები არჩევენ საკუთარ{" "}
          <span className="text-light-pink">ავატარს</span> და სახელს/მეტსახელს.
        </p>
        <p className="font-eurostile-demi text-[18px]">
          &bull; თუ <span className="text-light-pink">არ შეავსებ</span> სახელის
          ველს, სისტემა შენთვის{" "}
          <span className="text-light-pink">დააგენერირებს</span> ზედმეტსახელს,
          რომელიც ალბათ მაინც
        </p>
        <p className="font-eurostile-demi text-[18px]">
          &nbsp; <span className="text-light-pink">აჯობებდა</span> შენს
          ჩაწერილს.
        </p>
        <br />
        <p className="font-eurostile-bold text-[22px]">სავალდებულო</p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; <span className="text-light-pink">ქართული</span> ანბანი:
          აუცილებელია მხოლოდ ქართული ანბანის გამოყენება.
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; პატივისცემა: სწავლულებმა უნდა გამოიჩინონ{" "}
          <span className="text-light-pink">პატივისცემა</span> ერთმანეთის
          მიმართ.
        </p>
        <br />
        <p className="font-eurostile-demi text-[18px]">
          &bull; აკრძალული ქცევა:{" "}
          <span className="text-light-pink">არავითარი ბულინგი</span> ან ცუდი
          ქცევა (<span className="text-light-pink">Griefing</span>)!
        </p>
        <br />
        <br />
        <br />
        <br />
        <p className="font-eurostile-bold text-[20px]">
          თუ ასეთი რამე შეამჩნიეთ, როგორმე დაგვირეკეთ და ჩვენ მივხედავთ.
        </p>
        <br />
        <br />
        <br />
        <br />
        <br />
        <p className="font-eurostile-bold text-[40px]">
          <span className="text-light-pink">**</span>იყავი{" "}
          <span className="text-light-pink">ხელოვნიკის</span> სწავლული.{" "}
          <span className="text-light-pink">**</span>
        </p>
      </div>
      <Links />
    </main>
  );
}

export default Rules;

// eurostile-bold
// eurostile-demi
// eurostile-normal
